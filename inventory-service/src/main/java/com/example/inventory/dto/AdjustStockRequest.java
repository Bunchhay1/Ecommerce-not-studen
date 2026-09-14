package com.example.inventory.dto;

import com.example.inventory.enums.InventoryStatus;
import com.example.inventory.enums.MovementType;

public class AdjustStockRequest {

    private Integer totalQuantity;
    private Integer lowStockThreshold;
    private InventoryStatus status;
    private MovementType movementType = MovementType.ADJUSTMENT;
    private String reason;

    public AdjustStockRequest() {
    }

    // Getters and Setters
    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public InventoryStatus getStatus() { return status; }
    public void setStatus(InventoryStatus status) { this.status = status; }

    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
