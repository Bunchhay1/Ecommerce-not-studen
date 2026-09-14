package com.example.inventory.service;

import com.example.inventory.dto.*;
import com.example.inventory.entity.InventoryItem;
import com.example.inventory.entity.InventoryMovement;
import com.example.inventory.enums.InventoryStatus;
import com.example.inventory.enums.MovementType;
import com.example.inventory.exception.ResourceNotFoundException;
import com.example.inventory.kafka.InventoryEventProducer;
import com.example.inventory.kafka.events.InventoryEvents;
import com.example.inventory.repository.InventoryItemRepository;
import com.example.inventory.repository.MovementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository itemRepository;
    private final MovementRepository movementRepository;
    private final InventoryCacheService cacheService;
    private final InventoryEventProducer eventProducer;

    public InventoryService(InventoryItemRepository itemRepository,
                            MovementRepository movementRepository,
                            InventoryCacheService cacheService,
                            InventoryEventProducer eventProducer) {
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
        this.cacheService = cacheService;
        this.eventProducer = eventProducer;
    }

    @Transactional
    public InventoryResponse createItem(CreateInventoryItemRequest request) {
        log.info("Creating inventory item for variant '{}', sku '{}'", request.getVariantId(), request.getSku());

        itemRepository.findByVariantId(request.getVariantId()).ifPresent(i -> {
            throw new IllegalArgumentException("Inventory item already exists for variant: " + request.getVariantId());
        });
        itemRepository.findBySku(request.getSku()).ifPresent(i -> {
            throw new IllegalArgumentException("Inventory item already exists for sku: " + request.getSku());
        });

        InventoryItem item = new InventoryItem(
                request.getProductId(),
                request.getVariantId(),
                request.getSku(),
                request.getTotalQuantity(),
                request.getLowStockThreshold()
        );

        InventoryItem saved = itemRepository.save(item);

        if (saved.getTotalQuantity() > 0) {
            InventoryMovement movement = new InventoryMovement(
                    saved.getId(),
                    saved.getVariantId(),
                    MovementType.RECEIVE,
                    saved.getTotalQuantity(),
                    0, saved.getTotalQuantity(),
                    0, 0,
                    0, saved.getAvailableQuantity(),
                    "INITIAL_STOCK", saved.getId(), "Initial inventory creation"
            );
            movementRepository.save(movement);
        }

        InventoryResponse response = InventoryResponse.fromEntity(saved);
        cacheService.put(saved.getVariantId(), response);

        publishInventoryEvents(saved, "InventoryCreated");

        return response;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getByVariantId(String variantId) {
        InventoryResponse cached = cacheService.get(variantId);
        if (cached != null) {
            return cached;
        }

        InventoryItem item = itemRepository.findByVariantId(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for variant: " + variantId));

        InventoryResponse response = InventoryResponse.fromEntity(item);
        cacheService.put(variantId, response);
        return response;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getBySku(String sku) {
        InventoryItem item = itemRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for SKU: " + sku));
        return InventoryResponse.fromEntity(item);
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getByProductId(String productId) {
        return itemRepository.findByProductId(productId).stream()
                .map(InventoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CheckStockResponse checkStock(CheckStockRequest request) {
        List<String> variantIds = request.getItems().stream()
                .map(CheckStockRequest.CheckItem::getVariantId)
                .collect(Collectors.toList());

        List<InventoryItem> items = itemRepository.findByVariantIdIn(variantIds);
        Map<String, InventoryItem> itemMap = items.stream()
                .collect(Collectors.toMap(InventoryItem::getVariantId, i -> i));

        boolean overallAvailable = true;
        List<CheckStockResponse.CheckStockItemResult> results = new ArrayList<>();

        for (CheckStockRequest.CheckItem checkItem : request.getItems()) {
            InventoryItem item = itemMap.get(checkItem.getVariantId());
            int available = (item != null) ? item.getAvailableQuantity() : 0;
            boolean inStock = available >= checkItem.getQuantity();

            if (!inStock) {
                overallAvailable = false;
            }

            results.add(new CheckStockResponse.CheckStockItemResult(
                    checkItem.getVariantId(),
                    checkItem.getQuantity(),
                    available,
                    inStock
            ));
        }

        return new CheckStockResponse(overallAvailable, results);
    }

    @Transactional
    public InventoryResponse addStock(String variantId, AddStockRequest request) {
        log.info("Adding {} stock to variant '{}'", request.getQuantity(), variantId);

        InventoryItem item = itemRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for variant: " + variantId));

        int prevTotal = item.getTotalQuantity();
        int prevReserved = item.getReservedQuantity();
        int prevAvailable = item.getAvailableQuantity();

        item.setTotalQuantity(prevTotal + request.getQuantity());
        InventoryItem saved = itemRepository.save(item);

        InventoryMovement movement = new InventoryMovement(
                saved.getId(),
                saved.getVariantId(),
                MovementType.RECEIVE,
                request.getQuantity(),
                prevTotal, saved.getTotalQuantity(),
                prevReserved, saved.getReservedQuantity(),
                prevAvailable, saved.getAvailableQuantity(),
                request.getReferenceType() != null ? request.getReferenceType() : "RESTOCK",
                request.getReferenceId(),
                request.getReason() != null ? request.getReason() : "Add stock"
        );
        movementRepository.save(movement);

        cacheService.evict(variantId);
        InventoryResponse response = InventoryResponse.fromEntity(saved);
        cacheService.put(variantId, response);

        publishInventoryEvents(saved, "StockAdded");

        return response;
    }

    @Transactional
    public InventoryResponse adjustStock(String variantId, AdjustStockRequest request) {
        log.info("Adjusting stock for variant '{}'", variantId);

        InventoryItem item = itemRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for variant: " + variantId));

        int prevTotal = item.getTotalQuantity();
        int prevReserved = item.getReservedQuantity();
        int prevAvailable = item.getAvailableQuantity();

        if (request.getTotalQuantity() != null) {
            if (request.getTotalQuantity() < prevReserved) {
                throw new IllegalArgumentException("Total quantity cannot be less than currently reserved quantity: " + prevReserved);
            }
            item.setTotalQuantity(request.getTotalQuantity());
        }

        if (request.getLowStockThreshold() != null) {
            item.setLowStockThreshold(request.getLowStockThreshold());
        }

        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
        }

        item.recalculateAvailableAndStatus();
        InventoryItem saved = itemRepository.save(item);

        int quantityDiff = saved.getTotalQuantity() - prevTotal;
        InventoryMovement movement = new InventoryMovement(
                saved.getId(),
                saved.getVariantId(),
                request.getMovementType() != null ? request.getMovementType() : MovementType.ADJUSTMENT,
                Math.abs(quantityDiff),
                prevTotal, saved.getTotalQuantity(),
                prevReserved, saved.getReservedQuantity(),
                prevAvailable, saved.getAvailableQuantity(),
                "MANUAL_ADJUSTMENT", saved.getId(),
                request.getReason() != null ? request.getReason() : "Manual inventory adjustment"
        );
        movementRepository.save(movement);

        cacheService.evict(variantId);
        InventoryResponse response = InventoryResponse.fromEntity(saved);
        cacheService.put(variantId, response);

        publishInventoryEvents(saved, "StockAdjusted");

        return response;
    }

    private void publishInventoryEvents(InventoryItem item, String primaryEventType) {
        InventoryEvents.InventoryStockPayload payload = new InventoryEvents.InventoryStockPayload(
                item.getId(),
                item.getProductId(),
                item.getVariantId(),
                item.getSku(),
                item.getTotalQuantity(),
                item.getReservedQuantity(),
                item.getAvailableQuantity(),
                item.getStatus().name()
        );

        eventProducer.publishEvent(item.getVariantId(), primaryEventType, payload);

        // Check for low stock or out of stock triggers
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
}
