package com.example.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ReserveStockRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    private String idempotencyKey;

    @Min(value = 60, message = "TTL seconds must be at least 60")
    private Integer ttlSeconds = 900; // default 15 minutes

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<ReserveItem> items;

    public ReserveStockRequest() {
    }

    public ReserveStockRequest(String orderId, String idempotencyKey, List<ReserveItem> items) {
        this.orderId = orderId;
        this.idempotencyKey = idempotencyKey;
        this.items = items;
    }

    public static class ReserveItem {
        @NotBlank(message = "Variant ID is required")
        private String variantId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        public ReserveItem() {
        }

        public ReserveItem(String variantId, Integer quantity) {
            this.variantId = variantId;
            this.quantity = quantity;
        }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public Integer getTtlSeconds() { return ttlSeconds; }
    public void setTtlSeconds(Integer ttlSeconds) { this.ttlSeconds = ttlSeconds; }

    public List<ReserveItem> getItems() { return items; }
    public void setItems(List<ReserveItem> items) { this.items = items; }
}
