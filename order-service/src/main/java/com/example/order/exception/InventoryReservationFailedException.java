package com.example.order.exception;

public class InventoryReservationFailedException extends RuntimeException {
    public InventoryReservationFailedException(String message) {
        super(message);
    }
}
