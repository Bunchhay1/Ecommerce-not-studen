package com.example.inventory.entity;

import com.example.inventory.enums.InventoryStatus;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "product_id", nullable = false, length = 64)
    private String productId;

    @Column(name = "variant_id", nullable = false, unique = true, length = 64)
    private String variantId;

    @Column(name = "sku", nullable = false, unique = true, length = 64)
    private String sku;

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private InventoryStatus status = InventoryStatus.IN_STOCK;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public InventoryItem() {
    }

    public InventoryItem(String productId, String variantId, String sku, Integer totalQuantity, Integer lowStockThreshold) {
        this.id = UUID.randomUUID().toString();
        this.productId = productId;
        this.variantId = variantId;
        this.sku = sku;
        this.totalQuantity = totalQuantity != null ? totalQuantity : 0;
        this.reservedQuantity = 0;
        this.lowStockThreshold = lowStockThreshold != null ? lowStockThreshold : 10;
        this.recalculateAvailableAndStatus();
        this.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
        this.updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
        }
        this.updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
        recalculateAvailableAndStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
        recalculateAvailableAndStatus();
    }

    public void recalculateAvailableAndStatus() {
        if (this.totalQuantity == null) this.totalQuantity = 0;
        if (this.reservedQuantity == null) this.reservedQuantity = 0;
        this.availableQuantity = Math.max(0, this.totalQuantity - this.reservedQuantity);

        if (this.status != InventoryStatus.DISCONTINUED) {
            if (this.availableQuantity <= 0) {
                this.status = InventoryStatus.OUT_OF_STOCK;
            } else if (this.availableQuantity <= (this.lowStockThreshold != null ? this.lowStockThreshold : 10)) {
                this.status = InventoryStatus.LOW_STOCK;
            } else {
                this.status = InventoryStatus.IN_STOCK;
            }
        }
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

    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
        recalculateAvailableAndStatus();
    }

    public Integer getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
        recalculateAvailableAndStatus();
    }

    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
        recalculateAvailableAndStatus();
    }

    public InventoryStatus getStatus() { return status; }
    public void setStatus(InventoryStatus status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
