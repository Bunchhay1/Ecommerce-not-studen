package com.example.inventory.kafka.events;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public class InventoryEvents {

    public static class BaseEvent<T> {
        private String eventId;
        private String eventType;
        private OffsetDateTime timestamp;
        private T data;

        public BaseEvent() {
            this.eventId = UUID.randomUUID().toString();
            this.timestamp = OffsetDateTime.now(ZoneOffset.UTC);
        }

        public BaseEvent(String eventType, T data) {
            this.eventId = UUID.randomUUID().toString();
            this.eventType = eventType;
            this.timestamp = OffsetDateTime.now(ZoneOffset.UTC);
            this.data = data;
        }

        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public OffsetDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }

        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }

    public static class InventoryStockPayload {
        private String inventoryId;
        private String productId;
        private String variantId;
        private String sku;
        private Integer totalQuantity;
        private Integer reservedQuantity;
        private Integer availableQuantity;
        private String status;

        public InventoryStockPayload() {}

        public InventoryStockPayload(String inventoryId, String productId, String variantId, String sku,
                                     Integer totalQuantity, Integer reservedQuantity, Integer availableQuantity, String status) {
            this.inventoryId = inventoryId;
            this.productId = productId;
            this.variantId = variantId;
            this.sku = sku;
            this.totalQuantity = totalQuantity;
            this.reservedQuantity = reservedQuantity;
            this.availableQuantity = availableQuantity;
            this.status = status;
        }

        public String getInventoryId() { return inventoryId; }
        public void setInventoryId(String inventoryId) { this.inventoryId = inventoryId; }

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }

        public Integer getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

        public Integer getReservedQuantity() { return reservedQuantity; }
        public void setReservedQuantity(Integer reservedQuantity) { this.reservedQuantity = reservedQuantity; }

        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ReservationPayload {
        private String reservationId;
        private String orderId;
        private String variantId;
        private Integer quantity;
        private String status;

        public ReservationPayload() {}

        public ReservationPayload(String reservationId, String orderId, String variantId, Integer quantity, String status) {
            this.reservationId = reservationId;
            this.orderId = orderId;
            this.variantId = variantId;
            this.quantity = quantity;
            this.status = status;
        }

        public String getReservationId() { return reservationId; }
        public void setReservationId(String reservationId) { this.reservationId = reservationId; }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ThresholdAlertPayload {
        private String variantId;
        private String sku;
        private Integer availableQuantity;
        private Integer threshold;

        public ThresholdAlertPayload() {}

        public ThresholdAlertPayload(String variantId, String sku, Integer availableQuantity, Integer threshold) {
            this.variantId = variantId;
            this.sku = sku;
            this.availableQuantity = availableQuantity;
            this.threshold = threshold;
        }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }

        public Integer getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

        public Integer getThreshold() { return threshold; }
        public void setThreshold(Integer threshold) { this.threshold = threshold; }
    }
}
