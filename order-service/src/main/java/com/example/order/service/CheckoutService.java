package com.example.order.service;

import com.example.order.client.CartClient;
import com.example.order.client.InventoryClient;
import com.example.order.client.dto.CartClientDto;
import com.example.order.client.dto.InventoryClientDto;
import com.example.order.dto.CreateOrderRequest;
import com.example.order.dto.OrderResponse;
import com.example.order.entity.*;
import com.example.order.enums.OrderStatus;
import com.example.order.enums.PaymentStatus;
import com.example.order.enums.ShippingStatus;
import com.example.order.exception.CartEmptyException;
import com.example.order.exception.InventoryReservationFailedException;
import com.example.order.kafka.events.OrderEvents;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    private final OrderRepository orderRepository;
    private final OutboxEventRepository outboxRepository;
    private final CartClient cartClient;
    private final InventoryClient inventoryClient;
    private final OrderCacheService cacheService;
    private final ObjectMapper objectMapper;

    public CheckoutService(OrderRepository orderRepository,
                           OutboxEventRepository outboxRepository,
                           CartClient cartClient,
                           InventoryClient inventoryClient,
                           OrderCacheService cacheService,
                           ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.outboxRepository = outboxRepository;
        this.cartClient = cartClient;
        this.inventoryClient = inventoryClient;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public OrderResponse checkout(String userId, CreateOrderRequest request, String token) {
        log.info("Processing checkout for user '{}'", userId);

        // 1. Check idempotency
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent order replay for key '{}'", request.getIdempotencyKey());
                return OrderResponse.fromEntity(existing.get());
            }
        }

        // 2. Collect order items from cart or direct request
        List<OrderItem> orderItems = new ArrayList<>();
        boolean fromCart = false;

        if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            for (CreateOrderRequest.DirectOrderItem dItem : request.getDirectItems()) {
                OrderItem item = new OrderItem(
                        dItem.getProductId(),
                        dItem.getVariantId(),
                        dItem.getSku(),
                        dItem.getProductName(),
                        dItem.getImageUrl(),
                        dItem.getQuantity(),
                        dItem.getUnitPrice(),
                        BigDecimal.ZERO
                );
                orderItems.add(item);
            }
        } else {
            CartClientDto cart = cartClient.getActiveCart(token);
            if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new CartEmptyException("Cannot checkout: cart is empty");
            }
            fromCart = true;
            for (CartClientDto.CartItemClientDto cItem : cart.getItems()) {
                OrderItem item = new OrderItem(
                        cItem.getProductId(),
                        cItem.getVariantId(),
                        cItem.getSku(),
                        cItem.getProductName(),
                        cItem.getImageUrl(),
                        cItem.getQuantity(),
                        cItem.getUnitPrice(),
                        BigDecimal.ZERO
                );
                orderItems.add(item);
            }
        }

        if (orderItems.isEmpty()) {
            throw new CartEmptyException("No items available to checkout");
        }

        // 3. Server-side calculate financial amounts
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : orderItems) {
            subtotal = subtotal.add(item.getSubtotal());
        }

        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal shippingFee = subtotal.compareTo(new BigDecimal("100.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("10.00");
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP); // 10% tax
        BigDecimal total = subtotal.subtract(discount).add(shippingFee).add(tax).setScale(2, RoundingMode.HALF_UP);

        // 4. Create Order Entity
        String orderNumber = generateOrderNumber();
        Order order = new Order(
                orderNumber,
                userId,
                request.getCurrency() != null ? request.getCurrency() : "USD",
                request.getPaymentMethod(),
                request.getIdempotencyKey()
        );

        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setShippingFee(shippingFee);
        order.setTax(tax);
        order.setTotal(total);
        order.setNotes(request.getNotes());
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingStatus(ShippingStatus.NOT_STARTED);

        // Add items
        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        // Add shipping address
        if (request.getShippingAddress() != null) {
            OrderAddress shipAddr = request.getShippingAddress().toEntity();
            order.addAddress(shipAddr);
        }

        // Add initial status history
        OrderStatusHistory history = new OrderStatusHistory(
                null,
                OrderStatus.PENDING_PAYMENT,
                "Order created at checkout",
                userId
        );
        order.addStatusHistory(history);

        Order savedOrder = orderRepository.save(order);

        // 5. Reserve Inventory via Saga Step
        List<InventoryClientDto.ReserveItemDto> reserveItems = new ArrayList<>();
        for (OrderItem item : savedOrder.getItems()) {
            reserveItems.add(new InventoryClientDto.ReserveItemDto(item.getVariantId(), item.getQuantity()));
        }

        InventoryClientDto.ReserveStockRequestDto reserveReq = new InventoryClientDto.ReserveStockRequestDto(
                savedOrder.getId(),
                "order-res-" + savedOrder.getId(),
                900,
                reserveItems
        );

        InventoryClientDto.ReservationResponseDto resResponse = inventoryClient.reserveStock(reserveReq, token);
        if (resResponse == null || resResponse.getId() == null) {
            log.error("Stock reservation failed for order '{}'", savedOrder.getId());
            savedOrder.setStatus(OrderStatus.FAILED);
            savedOrder.addStatusHistory(new OrderStatusHistory(
                    OrderStatus.PENDING_PAYMENT,
                    OrderStatus.FAILED,
                    "Inventory reservation failed / insufficient stock",
                    "system"
            ));
            orderRepository.save(savedOrder);
            throw new InventoryReservationFailedException("Failed to reserve stock: one or more items unavailable");
        }

        savedOrder.setReservationId(resResponse.getId());
        Order finalOrder = orderRepository.save(savedOrder);

        // 6. Create Transactional Outbox Event
        createOutboxEvent(finalOrder, "OrderCreated");

        // 7. Clear cart if checkout originated from cart
        if (fromCart) {
            cartClient.clearCart(token);
        }

        OrderResponse response = OrderResponse.fromEntity(finalOrder);
        cacheService.put(finalOrder.getId(), response);

        log.info("Order '{}' created successfully with number '{}'", finalOrder.getId(), finalOrder.getOrderNumber());
        return response;
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

    private String generateOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%06d", new Random().nextInt(1000000));
        return "ORD-" + datePart + "-" + randomPart;
    }
}
