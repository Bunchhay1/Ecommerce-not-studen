package com.example.order.service;

import com.example.order.client.InventoryClient;
import com.example.order.dto.CancelOrderRequest;
import com.example.order.dto.OrderResponse;
import com.example.order.dto.UpdateOrderStatusRequest;
import com.example.order.entity.Order;
import com.example.order.enums.OrderStatus;
import com.example.order.enums.PaymentStatus;
import com.example.order.exception.InvalidOrderStateException;
import com.example.order.exception.OrderNotFoundException;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OrderStatusHistoryRepository;
import com.example.order.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository historyRepository;

    @Mock
    private OutboxEventRepository outboxRepository;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private OrderCacheService cacheService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        sampleOrder = new Order("ORD-20260913-001", "user-1", "USD", "CARD", "idemp-1");
        sampleOrder.setId("ord-uuid-1");
        sampleOrder.setReservationId("res-uuid-1");
    }

    @Test
    void testGetOrderById_Success_Owner() {
        when(cacheService.get("ord-uuid-1")).thenReturn(null);
        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));

        OrderResponse res = orderService.getOrderById("ord-uuid-1", "user-1", false);

        assertNotNull(res);
        assertEquals("ord-uuid-1", res.getId());
        assertEquals("user-1", res.getUserId());
        verify(cacheService).put(eq("ord-uuid-1"), any());
    }

    @Test
    void testGetOrderById_Forbidden_NotOwner() {
        when(cacheService.get("ord-uuid-1")).thenReturn(null);
        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));

        assertThrows(AccessDeniedException.class, () -> orderService.getOrderById("ord-uuid-1", "other-user", false));
    }

    @Test
    void testUpdateOrderStatus_ValidTransition() {
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);

        UpdateOrderStatusRequest updateReq = new UpdateOrderStatusRequest();
        updateReq.setStatus(OrderStatus.PAID);
        updateReq.setPaymentStatus(PaymentStatus.PAID);

        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus("ord-uuid-1", updateReq);

        assertNotNull(res);
        assertEquals(OrderStatus.PAID, res.getStatus());
        assertEquals(PaymentStatus.PAID, res.getPaymentStatus());
        verify(cacheService).evict("ord-uuid-1");
        verify(outboxRepository).save(any());
    }

    @Test
    void testUpdateOrderStatus_InvalidTransition_ThrowsException() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);

        UpdateOrderStatusRequest updateReq = new UpdateOrderStatusRequest();
        updateReq.setStatus(OrderStatus.PENDING_PAYMENT); // Invalid transition

        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));

        assertThrows(InvalidOrderStateException.class, () -> orderService.updateOrderStatus("ord-uuid-1", updateReq));
    }

    @Test
    void testCancelOrder_Success_ReleasesInventory() {
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.cancelOrder("ord-uuid-1", "user-1", false, new CancelOrderRequest("Decided not to buy"), "token");

        assertNotNull(res);
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        assertNotNull(res.getCancelledAt());
        verify(inventoryClient).releaseReservation(eq("res-uuid-1"), anyString(), eq("token"));
        verify(cacheService).evict("ord-uuid-1");
        verify(outboxRepository).save(any());
    }

    @Test
    void testHandlePaymentCallback_Success() {
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.handlePaymentCallback("ord-uuid-1", "SUCCESS", "PAY-REF-999", "token");

        assertNotNull(res);
        assertEquals(OrderStatus.PAID, res.getStatus());
        assertEquals(PaymentStatus.PAID, res.getPaymentStatus());
        assertEquals("PAY-REF-999", res.getPaymentReference());
        verify(inventoryClient).confirmReservation(eq("res-uuid-1"), eq("token"));
    }

    @Test
    void testHandlePaymentCallback_Failure() {
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById("ord-uuid-1")).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.handlePaymentCallback("ord-uuid-1", "FAILED", "PAY-REF-ERR", "token");

        assertNotNull(res);
        assertEquals(OrderStatus.FAILED, res.getStatus());
        assertEquals(PaymentStatus.FAILED, res.getPaymentStatus());
        verify(inventoryClient).releaseReservation(eq("res-uuid-1"), eq("Payment failed"), eq("token"));
    }
}
