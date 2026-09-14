package com.example.inventory.dto;

import com.example.inventory.entity.InventoryReservation;
import com.example.inventory.entity.ReservationItem;
import com.example.inventory.enums.ReservationStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ReservationResponse {

    private String id;
    private String orderId;
    private String idempotencyKey;
    private ReservationStatus status;
    private OffsetDateTime expiresAt;
    private List<ItemResponse> items;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public ReservationResponse() {
    }

    public static ReservationResponse fromEntity(InventoryReservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setId(reservation.getId());
        response.setOrderId(reservation.getOrderId());
        response.setIdempotencyKey(reservation.getIdempotencyKey());
        response.setStatus(reservation.getStatus());
        response.setExpiresAt(reservation.getExpiresAt());
        response.setCreatedAt(reservation.getCreatedAt());
        response.setUpdatedAt(reservation.getUpdatedAt());

        if (reservation.getItems() != null) {
            response.setItems(reservation.getItems().stream().map(ItemResponse::fromEntity).collect(Collectors.toList()));
        }
        return response;
    }

    public static class ItemResponse {
        private String id;
        private String productId;
        private String variantId;
        private String sku;
        private Integer quantity;

        public static ItemResponse fromEntity(ReservationItem item) {
            ItemResponse res = new ItemResponse();
            res.setId(item.getId());
            res.setProductId(item.getProductId());
            res.setVariantId(item.getVariantId());
            res.setSku(item.getSku());
            res.setQuantity(item.getQuantity());
            return res;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public List<ItemResponse> getItems() { return items; }
    public void setItems(List<ItemResponse> items) { this.items = items; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
