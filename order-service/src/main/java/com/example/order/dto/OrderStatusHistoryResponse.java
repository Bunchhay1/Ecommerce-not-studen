package com.example.order.dto;

import com.example.order.entity.OrderStatusHistory;
import com.example.order.enums.OrderStatus;
import java.time.OffsetDateTime;

public class OrderStatusHistoryResponse {

    private String id;
    private OrderStatus oldStatus;
    private OrderStatus newStatus;
    private String reason;
    private String changedBy;
    private OffsetDateTime createdAt;

    public OrderStatusHistoryResponse() {
    }

    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory entity) {
        OrderStatusHistoryResponse dto = new OrderStatusHistoryResponse();
        dto.setId(entity.getId());
        dto.setOldStatus(entity.getOldStatus());
        dto.setNewStatus(entity.getNewStatus());
        dto.setReason(entity.getReason());
        dto.setChangedBy(entity.getChangedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public OrderStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(OrderStatus oldStatus) { this.oldStatus = oldStatus; }

    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
