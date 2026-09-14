package com.example.marketplace.dto;

import com.example.marketplace.entity.SellerPerformance;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SellerPerformanceResponse(
        UUID id,
        UUID sellerId,
        int totalOrders,
        int completedOrders,
        int cancelledOrders,
        int returnedOrders,
        int lateShipments,
        BigDecimal averageRating,
        int responseTimeMinutes,
        OffsetDateTime updatedAt
) {
    public static SellerPerformanceResponse fromEntity(SellerPerformance perf) {
        return new SellerPerformanceResponse(
                perf.getId(),
                perf.getSellerId(),
                perf.getTotalOrders(),
                perf.getCompletedOrders(),
                perf.getCancelledOrders(),
                perf.getReturnedOrders(),
                perf.getLateShipments(),
                perf.getAverageRating(),
                perf.getResponseTimeMinutes(),
                perf.getUpdatedAt()
        );
    }
}
