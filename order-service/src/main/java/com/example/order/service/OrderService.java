package com.example.order.service;

import com.example.order.client.InventoryClient;
import com.example.order.dto.*;
import com.example.order.entity.Order;
import com.example.order.entity.OrderStatusHistory;
import com.example.order.entity.OutboxEvent;
import com.example.order.enums.OrderStatus;
import com.example.order.enums.PaymentStatus;
import com.example.order.exception.InvalidOrderStateException;
import com.example.order.exception.OrderNotFoundException;
import com.example.order.kafka.events.OrderEvents;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OrderStatusHistoryRepository;
import com.example.order.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OutboxEventRepository outboxRepository;
    private final InventoryClient inventoryClient;
    private final OrderCacheService cacheService;
    private final ObjectMapper objectMapper;

    public OrderService(OrderRepository orderRepository,
                        OrderStatusHistoryRepository historyRepository,
                        OutboxEventRepository outboxRepository,
                        InventoryClient inventoryClient,
                        OrderCacheService cacheService,
                        ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.outboxRepository = outboxRepository;
        this.inventoryClient = inventoryClient;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String orderId, String userId, boolean isAdmin) {
        OrderResponse cached = cacheService.get(orderId);
        if (cached != null) {
            if (!isAdmin && !cached.getUserId().equals(userId)) {
                throw new AccessDeniedException("Access denied: You do not own this order");
            }
            return cached;
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this order");
        }

        OrderResponse response = OrderResponse.fromEntity(order);
        cacheService.put(orderId, response);
        return response;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(String orderNumber, String userId, boolean isAdmin) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with number: " + orderNumber));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this order");
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getUserOrders(String userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.fromPage(page, OrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(OrderStatus status, Pageable pageable) {
        Page<Order> page;
        if (status != null) {
            page = orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = orderRepository.findAll(pageable);
        }
        return PageResponse.fromPage(page, OrderResponse::fromEntity);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new InvalidOrderStateException(
                    String.format("Cannot transition order status from '%s' to '%s'", oldStatus, newStatus));
        }

        order.setStatus(newStatus);
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus());
        }
        if (request.getShippingStatus() != null) {
            order.setShippingStatus(request.getShippingStatus());
        }

        if (newStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(OffsetDateTime.now(ZoneOffset.UTC));
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setCancelledAt(OffsetDateTime.now(ZoneOffset.UTC));
        }

        OrderStatusHistory history = new OrderStatusHistory(
                oldStatus,
                newStatus,
                request.getReason() != null ? request.getReason() : "Status updated by admin/system",
                request.getChangedBy() != null ? request.getChangedBy() : "admin"
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        cacheService.evict(orderId);

        createOutboxEvent(saved, "OrderStatusChanged");

        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(String orderId, String userId, boolean isAdmin, CancelOrderRequest request, String token) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this order");
        }

        OrderStatus oldStatus = order.getStatus();
        if (oldStatus == OrderStatus.CANCELLED) {
            return OrderResponse.fromEntity(order);
        }

        if (!oldStatus.canTransitionTo(OrderStatus.CANCELLED)) {
            throw new InvalidOrderStateException("Order cannot be cancelled in status: " + oldStatus);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(OffsetDateTime.now(ZoneOffset.UTC));

        OrderStatusHistory history = new OrderStatusHistory(
                oldStatus,
                OrderStatus.CANCELLED,
                request != null && request.getReason() != null ? request.getReason() : "Order cancelled",
                isAdmin ? "admin" : userId
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        cacheService.evict(orderId);

        // Saga Step: Release inventory reservation
        if (saved.getReservationId() != null) {
            inventoryClient.releaseReservation(saved.getReservationId(), history.getReason(), token);
        }

        createOutboxEvent(saved, "OrderCancelled");

        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse handlePaymentCallback(String orderId, String status, String paymentRef, String token) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        OrderStatus oldStatus = order.getStatus();

        if ("SUCCESS".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
            order.setStatus(OrderStatus.PAID);
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setPaymentReference(paymentRef);

            OrderStatusHistory history = new OrderStatusHistory(
                    oldStatus,
                    OrderStatus.PAID,
                    "Payment confirmed: " + paymentRef,
                    "payment-service"
            );
            order.addStatusHistory(history);

            Order saved = orderRepository.save(order);
            cacheService.evict(orderId);

            // Confirm inventory reservation
            if (saved.getReservationId() != null) {
                inventoryClient.confirmReservation(saved.getReservationId(), token);
            }

            createOutboxEvent(saved, "OrderPaid");
            return OrderResponse.fromEntity(saved);
        } else {
            order.setStatus(OrderStatus.FAILED);
            order.setPaymentStatus(PaymentStatus.FAILED);

            OrderStatusHistory history = new OrderStatusHistory(
                    oldStatus,
                    OrderStatus.FAILED,
                    "Payment failed",
                    "payment-service"
            );
            order.addStatusHistory(history);

            Order saved = orderRepository.save(order);
            cacheService.evict(orderId);

            // Release inventory reservation
            if (saved.getReservationId() != null) {
                inventoryClient.releaseReservation(saved.getReservationId(), "Payment failed", token);
            }

            createOutboxEvent(saved, "OrderFailed");
            return OrderResponse.fromEntity(saved);
        }
    }

    @Transactional(readOnly = true)
    public List<OrderStatusHistoryResponse> getOrderHistory(String orderId, String userId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied: You do not own this order");
        }

        return historyRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(OrderStatusHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void createOutboxEvent(Order order, String eventType) {
        try {
            OrderEvents.OrderEventPayload payload = new OrderEvents.OrderEventPayload(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getUserId(),
                    order.getStatus().name(),
                    order.getTotal(),
                    order.getCurrency(),
                    order.getPaymentStatus().name(),
                    order.getShippingStatus().name()
            );

            OrderEvents.BaseEvent<OrderEvents.OrderEventPayload> event = new OrderEvents.BaseEvent<>(eventType, payload);
            String json = objectMapper.writeValueAsString(event);

            OutboxEvent outbox = new OutboxEvent("ORDER", order.getId(), eventType, json);
            outboxRepository.save(outbox);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event for order '{}': {}", order.getId(), e.getMessage());
        }
    }
}
