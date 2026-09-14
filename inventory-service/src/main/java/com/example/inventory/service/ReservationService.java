package com.example.inventory.service;

import com.example.inventory.dto.ReservationResponse;
import com.example.inventory.dto.ReserveStockRequest;
import com.example.inventory.entity.InventoryItem;
import com.example.inventory.entity.InventoryMovement;
import com.example.inventory.entity.InventoryReservation;
import com.example.inventory.entity.ReservationItem;
import com.example.inventory.enums.InventoryStatus;
import com.example.inventory.enums.MovementType;
import com.example.inventory.enums.ReservationStatus;
import com.example.inventory.exception.InsufficientStockException;
import com.example.inventory.exception.InvalidReservationStateException;
import com.example.inventory.exception.ResourceNotFoundException;
import com.example.inventory.kafka.InventoryEventProducer;
import com.example.inventory.kafka.events.InventoryEvents;
import com.example.inventory.repository.InventoryItemRepository;
import com.example.inventory.repository.MovementRepository;
import com.example.inventory.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);

    private final ReservationRepository reservationRepository;
    private final InventoryItemRepository itemRepository;
    private final MovementRepository movementRepository;
    private final InventoryCacheService cacheService;
    private final InventoryEventProducer eventProducer;

    public ReservationService(ReservationRepository reservationRepository,
                              InventoryItemRepository itemRepository,
                              MovementRepository movementRepository,
                              InventoryCacheService cacheService,
                              InventoryEventProducer eventProducer) {
        this.reservationRepository = reservationRepository;
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
        this.cacheService = cacheService;
        this.eventProducer = eventProducer;
    }

    @Transactional
    public ReservationResponse createReservation(ReserveStockRequest request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<InventoryReservation> existing = reservationRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent reservation replay for key '{}'", request.getIdempotencyKey());
                return ReservationResponse.fromEntity(existing.get());
            }
        }

        List<String> variantIds = request.getItems().stream()
                .map(ReserveStockRequest.ReserveItem::getVariantId)
                .collect(Collectors.toList());

        // Lock all inventory rows in order to avoid deadlocks
        Collections.sort(variantIds);
        List<InventoryItem> lockedItems = itemRepository.findByVariantIdInForUpdate(variantIds);
        Map<String, InventoryItem> itemMap = lockedItems.stream()
                .collect(Collectors.toMap(InventoryItem::getVariantId, i -> i));

        // Step 1: Validate stock availability for all items first
        for (ReserveStockRequest.ReserveItem reqItem : request.getItems()) {
            InventoryItem item = itemMap.get(reqItem.getVariantId());
            if (item == null) {
                throw new ResourceNotFoundException("Inventory item not found for variant: " + reqItem.getVariantId());
            }
            if (item.getAvailableQuantity() < reqItem.getQuantity()) {
                throw new InsufficientStockException(reqItem.getVariantId(), reqItem.getQuantity(), item.getAvailableQuantity());
            }
        }

        // Step 2: Build reservation entity
        int ttl = request.getTtlSeconds() != null ? request.getTtlSeconds() : 900;
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(ttl);

        InventoryReservation reservation = new InventoryReservation(
                request.getOrderId(),
                request.getIdempotencyKey(),
                expiresAt
        );

        // Step 3: Perform stock reservation and audit movement logging
        for (ReserveStockRequest.ReserveItem reqItem : request.getItems()) {
            InventoryItem item = itemMap.get(reqItem.getVariantId());

            int prevTotal = item.getTotalQuantity();
            int prevReserved = item.getReservedQuantity();
            int prevAvailable = item.getAvailableQuantity();

            item.setReservedQuantity(prevReserved + reqItem.getQuantity());
            itemRepository.save(item);

            ReservationItem resItem = new ReservationItem(
                    item.getProductId(),
                    item.getVariantId(),
                    item.getSku(),
                    reqItem.getQuantity()
            );
            reservation.addItem(resItem);

            InventoryMovement movement = new InventoryMovement(
                    item.getId(),
                    item.getVariantId(),
                    MovementType.RESERVE,
                    reqItem.getQuantity(),
                    prevTotal, item.getTotalQuantity(),
                    prevReserved, item.getReservedQuantity(),
                    prevAvailable, item.getAvailableQuantity(),
                    "ORDER_RESERVATION", request.getOrderId(), "Stock reserved for order"
            );
            movementRepository.save(movement);

            cacheService.evict(item.getVariantId());

            // Kafka Event per item
            InventoryEvents.ReservationPayload payload = new InventoryEvents.ReservationPayload(
                    reservation.getId(),
                    request.getOrderId(),
                    item.getVariantId(),
                    reqItem.getQuantity(),
                    ReservationStatus.PENDING.name()
            );
            eventProducer.publishEvent(item.getVariantId(), "StockReserved", payload);

            if (item.getAvailableQuantity() == 0) {
                eventProducer.publishEvent(item.getVariantId(), "StockOut", payload);
            } else if (item.getStatus() == InventoryStatus.LOW_STOCK) {
                InventoryEvents.ThresholdAlertPayload alertPayload = new InventoryEvents.ThresholdAlertPayload(
                        item.getVariantId(),
                        item.getSku(),
                        item.getAvailableQuantity(),
                        item.getLowStockThreshold()
                );
                eventProducer.publishEvent(item.getVariantId(), "StockLow", alertPayload);
            }
        }

        InventoryReservation savedReservation = reservationRepository.save(reservation);
        log.info("Reservation created successfully with id '{}' for order '{}'", savedReservation.getId(), request.getOrderId());
        return ReservationResponse.fromEntity(savedReservation);
    }

    @Transactional
    public ReservationResponse confirmReservation(String reservationId) {
        InventoryReservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            log.info("Reservation '{}' already confirmed", reservationId);
            return ReservationResponse.fromEntity(reservation);
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new InvalidReservationStateException("Cannot confirm reservation in status: " + reservation.getStatus());
        }

        for (ReservationItem resItem : reservation.getItems()) {
            InventoryItem item = itemRepository.findByVariantIdForUpdate(resItem.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for variant: " + resItem.getVariantId()));

            int prevTotal = item.getTotalQuantity();
            int prevReserved = item.getReservedQuantity();
            int prevAvailable = item.getAvailableQuantity();

            // Permanent deduction: total -= qty, reserved -= qty (available stays unchanged)
            item.setReservedQuantity(Math.max(0, prevReserved - resItem.getQuantity()));
            item.setTotalQuantity(Math.max(0, prevTotal - resItem.getQuantity()));
            itemRepository.save(item);

            InventoryMovement movement = new InventoryMovement(
                    item.getId(),
                    item.getVariantId(),
                    MovementType.SALE,
                    resItem.getQuantity(),
                    prevTotal, item.getTotalQuantity(),
                    prevReserved, item.getReservedQuantity(),
                    prevAvailable, item.getAvailableQuantity(),
                    "ORDER_CONFIRMATION", reservation.getOrderId(), "Order payment confirmed / stock sold"
            );
            movementRepository.save(movement);

            cacheService.evict(item.getVariantId());

            InventoryEvents.ReservationPayload payload = new InventoryEvents.ReservationPayload(
                    reservation.getId(),
                    reservation.getOrderId(),
                    item.getVariantId(),
                    resItem.getQuantity(),
                    ReservationStatus.CONFIRMED.name()
            );
            eventProducer.publishEvent(item.getVariantId(), "StockConfirmed", payload);
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        InventoryReservation saved = reservationRepository.save(reservation);
        log.info("Reservation '{}' confirmed successfully", reservationId);
        return ReservationResponse.fromEntity(saved);
    }

    @Transactional
    public ReservationResponse releaseReservation(String reservationId, String reason) {
        InventoryReservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() == ReservationStatus.RELEASED) {
            log.info("Reservation '{}' already released", reservationId);
            return ReservationResponse.fromEntity(reservation);
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new InvalidReservationStateException("Cannot release reservation in status: " + reservation.getStatus());
        }

        for (ReservationItem resItem : reservation.getItems()) {
            InventoryItem item = itemRepository.findByVariantIdForUpdate(resItem.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for variant: " + resItem.getVariantId()));

            int prevTotal = item.getTotalQuantity();
            int prevReserved = item.getReservedQuantity();
            int prevAvailable = item.getAvailableQuantity();

            // Release: reserved -= qty (available increases back)
            item.setReservedQuantity(Math.max(0, prevReserved - resItem.getQuantity()));
            itemRepository.save(item);

            InventoryMovement movement = new InventoryMovement(
                    item.getId(),
                    item.getVariantId(),
                    MovementType.RELEASE,
                    resItem.getQuantity(),
                    prevTotal, item.getTotalQuantity(),
                    prevReserved, item.getReservedQuantity(),
                    prevAvailable, item.getAvailableQuantity(),
                    "ORDER_RELEASE", reservation.getOrderId(),
                    reason != null ? reason : "Order cancelled / payment failed"
            );
            movementRepository.save(movement);

            cacheService.evict(item.getVariantId());

            InventoryEvents.ReservationPayload payload = new InventoryEvents.ReservationPayload(
                    reservation.getId(),
                    reservation.getOrderId(),
                    item.getVariantId(),
                    resItem.getQuantity(),
                    ReservationStatus.RELEASED.name()
            );
            eventProducer.publishEvent(item.getVariantId(), "StockReleased", payload);
        }

        reservation.setStatus(ReservationStatus.RELEASED);
        InventoryReservation saved = reservationRepository.save(reservation);
        log.info("Reservation '{}' released successfully", reservationId);
        return ReservationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(String reservationId) {
        InventoryReservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));
        return ReservationResponse.fromEntity(reservation);
    }
}
