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
import com.example.inventory.kafka.InventoryEventProducer;
import com.example.inventory.repository.InventoryItemRepository;
import com.example.inventory.repository.MovementRepository;
import com.example.inventory.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private InventoryItemRepository itemRepository;

    @Mock
    private MovementRepository movementRepository;

    @Mock
    private InventoryCacheService cacheService;

    @Mock
    private InventoryEventProducer eventProducer;

    @InjectMocks
    private ReservationService reservationService;

    private InventoryItem item1;
    private InventoryItem item2;

    @BeforeEach
    void setUp() {
        item1 = new InventoryItem("prod-1", "var-1", "SKU-1", 10, 2);
        item1.setId("inv-1");
        item2 = new InventoryItem("prod-2", "var-2", "SKU-2", 5, 2);
        item2.setId("inv-2");
    }

    @Test
    void testCreateReservation_Success() {
        ReserveStockRequest request = new ReserveStockRequest("order-100", "idemp-key-100", List.of(
                new ReserveStockRequest.ReserveItem("var-1", 2),
                new ReserveStockRequest.ReserveItem("var-2", 1)
        ));

        when(reservationRepository.findByIdempotencyKey("idemp-key-100")).thenReturn(Optional.empty());
        when(itemRepository.findByVariantIdInForUpdate(anyList())).thenReturn(List.of(item1, item2));
        when(reservationRepository.save(any(InventoryReservation.class))).thenAnswer(inv -> {
            InventoryReservation res = inv.getArgument(0);
            res.setId("res-uuid-100");
            return res;
        });

        ReservationResponse response = reservationService.createReservation(request);

        assertNotNull(response);
        assertEquals("order-100", response.getOrderId());
        assertEquals("idemp-key-100", response.getIdempotencyKey());
        assertEquals(ReservationStatus.PENDING, response.getStatus());

        // Check stock state on item1
        assertEquals(10, item1.getTotalQuantity());
        assertEquals(2, item1.getReservedQuantity());
        assertEquals(8, item1.getAvailableQuantity());

        // Check stock state on item2
        assertEquals(5, item2.getTotalQuantity());
        assertEquals(1, item2.getReservedQuantity());
        assertEquals(4, item2.getAvailableQuantity());

        verify(movementRepository, times(2)).save(argThat(m -> m.getType() == MovementType.RESERVE));
        verify(eventProducer, times(2)).publishEvent(anyString(), eq("StockReserved"), any());
    }

    @Test
    void testCreateReservation_InsufficientStock_ThrowsException() {
        ReserveStockRequest request = new ReserveStockRequest("order-100", "idemp-key-100", List.of(
                new ReserveStockRequest.ReserveItem("var-1", 20) // Only 10 available
        ));

        when(reservationRepository.findByIdempotencyKey("idemp-key-100")).thenReturn(Optional.empty());
        when(itemRepository.findByVariantIdInForUpdate(anyList())).thenReturn(List.of(item1));

        assertThrows(InsufficientStockException.class, () -> reservationService.createReservation(request));

        // Ensure no movements or reservations saved
        verify(movementRepository, never()).save(any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCreateReservation_IdempotentReplay() {
        InventoryReservation existing = new InventoryReservation("order-100", "idemp-key-100", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        existing.setId("res-existing-123");

        ReserveStockRequest request = new ReserveStockRequest("order-100", "idemp-key-100", List.of(
                new ReserveStockRequest.ReserveItem("var-1", 2)
        ));

        when(reservationRepository.findByIdempotencyKey("idemp-key-100")).thenReturn(Optional.of(existing));

        ReservationResponse response = reservationService.createReservation(request);

        assertNotNull(response);
        assertEquals("res-existing-123", response.getId());
        verify(itemRepository, never()).findByVariantIdInForUpdate(anyList());
    }

    @Test
    void testConfirmReservation_Success() {
        InventoryReservation reservation = new InventoryReservation("order-100", "idemp-100", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        reservation.setId("res-100");
        ReservationItem resItem = new ReservationItem("prod-1", "var-1", "SKU-1", 2);
        reservation.addItem(resItem);

        // Prepare item1 as reserved
        item1.setReservedQuantity(2);
        item1.recalculateAvailableAndStatus(); // total 10, reserved 2, available 8

        when(reservationRepository.findById("res-100")).thenReturn(Optional.of(reservation));
        when(itemRepository.findByVariantIdForUpdate("var-1")).thenReturn(Optional.of(item1));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.confirmReservation("res-100");

        assertNotNull(response);
        assertEquals(ReservationStatus.CONFIRMED, response.getStatus());

        // total = 10 - 2 = 8, reserved = 2 - 2 = 0, available = 8
        assertEquals(8, item1.getTotalQuantity());
        assertEquals(0, item1.getReservedQuantity());
        assertEquals(8, item1.getAvailableQuantity());

        verify(movementRepository).save(argThat(m -> m.getType() == MovementType.SALE && m.getQuantity() == 2));
        verify(eventProducer).publishEvent(eq("var-1"), eq("StockConfirmed"), any());
    }

    @Test
    void testReleaseReservation_Success() {
        InventoryReservation reservation = new InventoryReservation("order-100", "idemp-100", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        reservation.setId("res-100");
        ReservationItem resItem = new ReservationItem("prod-1", "var-1", "SKU-1", 3);
        reservation.addItem(resItem);

        // Prepare item1 as reserved
        item1.setReservedQuantity(3);
        item1.recalculateAvailableAndStatus(); // total 10, reserved 3, available 7

        when(reservationRepository.findById("res-100")).thenReturn(Optional.of(reservation));
        when(itemRepository.findByVariantIdForUpdate("var-1")).thenReturn(Optional.of(item1));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.releaseReservation("res-100", "Customer cancelled order");

        assertNotNull(response);
        assertEquals(ReservationStatus.RELEASED, response.getStatus());

        // total = 10, reserved = 3 - 3 = 0, available = 10
        assertEquals(10, item1.getTotalQuantity());
        assertEquals(0, item1.getReservedQuantity());
        assertEquals(10, item1.getAvailableQuantity());

        verify(movementRepository).save(argThat(m -> m.getType() == MovementType.RELEASE && m.getQuantity() == 3));
        verify(eventProducer).publishEvent(eq("var-1"), eq("StockReleased"), any());
    }

    @Test
    void testConfirmReservation_InvalidState_ThrowsException() {
        InventoryReservation reservation = new InventoryReservation("order-100", "idemp-100", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        reservation.setStatus(ReservationStatus.RELEASED);

        when(reservationRepository.findById("res-100")).thenReturn(Optional.of(reservation));

        assertThrows(InvalidReservationStateException.class, () -> reservationService.confirmReservation("res-100"));
    }
}
