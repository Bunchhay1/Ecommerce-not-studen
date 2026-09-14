package com.example.order.client.dto;

import java.util.List;

public class InventoryClientDto {

    public static class ReserveStockRequestDto {
        private String orderId;
        private String idempotencyKey;
        private Integer ttlSeconds;
        private List<ReserveItemDto> items;

        public ReserveStockRequestDto() {}

        public ReserveStockRequestDto(String orderId, String idempotencyKey, Integer ttlSeconds, List<ReserveItemDto> items) {
            this.orderId = orderId;
            this.idempotencyKey = idempotencyKey;
            this.ttlSeconds = ttlSeconds;
            this.items = items;
        }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

        public Integer getTtlSeconds() { return ttlSeconds; }
        public void setTtlSeconds(Integer ttlSeconds) { this.ttlSeconds = ttlSeconds; }

        public List<ReserveItemDto> getItems() { return items; }
        public void setItems(List<ReserveItemDto> items) { this.items = items; }
    }

    public static class ReserveItemDto {
        private String variantId;
        private Integer quantity;

        public ReserveItemDto() {}

        public ReserveItemDto(String variantId, Integer quantity) {
            this.variantId = variantId;
            this.quantity = quantity;
        }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public static class ReservationResponseDto {
        private String id;
        private String orderId;
        private String status;

        public ReservationResponseDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
