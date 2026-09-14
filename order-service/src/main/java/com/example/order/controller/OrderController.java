package com.example.order.controller;

import com.example.order.dto.*;
import com.example.order.service.CheckoutService;
import com.example.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Customer Order & Checkout APIs")
public class OrderController {

    private final CheckoutService checkoutService;
    private final OrderService orderService;

    public OrderController(CheckoutService checkoutService, OrderService orderService) {
        this.checkoutService = checkoutService;
        this.orderService = orderService;
    }

    @PostMapping
    @Operation(summary = "Checkout and create a new order from active cart or direct items")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyHeader,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymousUser";
        String token = authentication != null && authentication.getCredentials() instanceof String ? (String) authentication.getCredentials() : null;

        if (idempotencyHeader != null && !idempotencyHeader.isBlank()) {
            request.setIdempotencyKey(idempotencyHeader);
        }

        OrderResponse response = checkoutService.checkout(userId, request, token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all orders for the authenticated customer (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymousUser";
        PageResponse<OrderResponse> response = orderService.getUserOrders(userId, PageRequest.of(Math.max(0, page - 1), size));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details by order ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable String id,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymousUser";
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        OrderResponse response = orderService.getOrderById(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable String id,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymousUser";
        String token = authentication != null && authentication.getCredentials() instanceof String ? (String) authentication.getCredentials() : null;
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        OrderResponse response = orderService.cancelOrder(id, userId, isAdmin, request, token);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get audit trail history of status changes for an order")
    public ResponseEntity<ApiResponse<List<OrderStatusHistoryResponse>>> getOrderHistory(
            @PathVariable String id,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymousUser";
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<OrderStatusHistoryResponse> response = orderService.getOrderHistory(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/payment-callback")
    @Operation(summary = "Payment confirmation or failure webhook callback")
    public ResponseEntity<ApiResponse<OrderResponse>> handlePaymentCallback(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String status = body.getOrDefault("status", "SUCCESS");
        String paymentRef = body.getOrDefault("paymentReference", "PAY-" + id);
        String token = authentication != null && authentication.getCredentials() instanceof String ? (String) authentication.getCredentials() : null;

        OrderResponse response = orderService.handlePaymentCallback(id, status, paymentRef, token);
        return ResponseEntity.ok(ApiResponse.success("Payment callback processed", response));
    }
}
