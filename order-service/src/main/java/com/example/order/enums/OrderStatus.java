package com.example.order.enums;

import java.util.EnumSet;

public enum OrderStatus {
    PENDING,
    PENDING_PAYMENT,
    PAID,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    FAILED,
    REFUNDED;

    public boolean canTransitionTo(OrderStatus next) {
        if (this == next) return true;

        return switch (this) {
            case PENDING -> EnumSet.of(PENDING_PAYMENT, CANCELLED, FAILED).contains(next);
            case PENDING_PAYMENT -> EnumSet.of(PAID, CANCELLED, FAILED).contains(next);
            case PAID -> EnumSet.of(PROCESSING, REFUNDED, CANCELLED).contains(next);
            case PROCESSING -> EnumSet.of(SHIPPED, CANCELLED, REFUNDED).contains(next);
            case SHIPPED -> EnumSet.of(DELIVERED, RETURNED_STATE()).contains(next);
            case DELIVERED -> EnumSet.of(COMPLETED, REFUNDED).contains(next);
            case COMPLETED, CANCELLED, FAILED, REFUNDED -> false;
        };
    }

    private static OrderStatus RETURNED_STATE() {
        return REFUNDED;
    }
}
