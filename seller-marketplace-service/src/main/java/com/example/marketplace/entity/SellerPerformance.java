package com.example.marketplace.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "seller_performance")
public class SellerPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "seller_id", nullable = false, unique = true)
    private UUID sellerId;

    @Column(name = "total_orders", nullable = false)
    private int totalOrders = 0;

    @Column(name = "completed_orders", nullable = false)
    private int completedOrders = 0;

    @Column(name = "cancelled_orders", nullable = false)
    private int cancelledOrders = 0;

    @Column(name = "returned_orders", nullable = false)
    private int returnedOrders = 0;

    @Column(name = "late_shipments", nullable = false)
    private int lateShipments = 0;

    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = new BigDecimal("5.00");

    @Column(name = "response_time_minutes", nullable = false)
    private int responseTimeMinutes = 60;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC);

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSellerId() {
        return sellerId;
    }

    public void setSellerId(UUID sellerId) {
        this.sellerId = sellerId;
    }

    public int getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(int totalOrders) {
        this.totalOrders = totalOrders;
    }

    public int getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(int completedOrders) {
        this.completedOrders = completedOrders;
    }

    public int getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(int cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public int getReturnedOrders() {
        return returnedOrders;
    }

    public void setReturnedOrders(int returnedOrders) {
        this.returnedOrders = returnedOrders;
    }

    public int getLateShipments() {
        return lateShipments;
    }

    public void setLateShipments(int lateShipments) {
        this.lateShipments = lateShipments;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public int getResponseTimeMinutes() {
        return responseTimeMinutes;
    }

    public void setResponseTimeMinutes(int responseTimeMinutes) {
        this.responseTimeMinutes = responseTimeMinutes;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
