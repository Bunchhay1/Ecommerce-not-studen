package com.example.inventory.entity;

import com.example.inventory.enums.MovementType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "inventory_id", nullable = false, length = 36)
    private String inventoryId;

    @Column(name = "variant_id", nullable = false, length = 64)
    private String variantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private MovementType type;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "previous_total", nullable = false)
    private Integer previousTotal;

    @Column(name = "new_total", nullable = false)
    private Integer newTotal;

    @Column(name = "previous_reserved", nullable = false)
    private Integer previousReserved;

    @Column(name = "new_reserved", nullable = false)
    private Integer newReserved;

    @Column(name = "previous_available", nullable = false)
    private Integer previousAvailable;

    @Column(name = "new_available", nullable = false)
    private Integer newAvailable;

    @Column(name = "reference_type", length = 64)
    private String referenceType;

    @Column(name = "reference_id", length = 64)
    private String referenceId;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public InventoryMovement() {
    }

    public InventoryMovement(String inventoryId, String variantId, MovementType type, Integer quantity,
                             Integer previousTotal, Integer newTotal,
                             Integer previousReserved, Integer newReserved,
                             Integer previousAvailable, Integer newAvailable,
                             String referenceType, String referenceId, String reason) {
        this.id = UUID.randomUUID().toString();
        this.inventoryId = inventoryId;
        this.variantId = variantId;
        this.type = type;
        this.quantity = quantity;
        this.previousTotal = previousTotal;
        this.newTotal = newTotal;
        this.previousReserved = previousReserved;
        this.newReserved = newReserved;
        this.previousAvailable = previousAvailable;
        this.newAvailable = newAvailable;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.reason = reason;
        this.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInventoryId() { return inventoryId; }
    public void setInventoryId(String inventoryId) { this.inventoryId = inventoryId; }

    public String getVariantId() { return variantId; }
    public void setVariantId(String variantId) { this.variantId = variantId; }

    public MovementType getType() { return type; }
    public void setType(MovementType type) { this.type = type; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getPreviousTotal() { return previousTotal; }
    public void setPreviousTotal(Integer previousTotal) { this.previousTotal = previousTotal; }

    public Integer getNewTotal() { return newTotal; }
    public void setNewTotal(Integer newTotal) { this.newTotal = newTotal; }

    public Integer getPreviousReserved() { return previousReserved; }
    public void setPreviousReserved(Integer previousReserved) { this.previousReserved = previousReserved; }

    public Integer getNewReserved() { return newReserved; }
    public void setNewReserved(Integer newReserved) { this.newReserved = newReserved; }

    public Integer getPreviousAvailable() { return previousAvailable; }
    public void setPreviousAvailable(Integer previousAvailable) { this.previousAvailable = previousAvailable; }

    public Integer getNewAvailable() { return newAvailable; }
    public void setNewAvailable(Integer newAvailable) { this.newAvailable = newAvailable; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
