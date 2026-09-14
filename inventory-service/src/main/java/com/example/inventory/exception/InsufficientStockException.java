package com.example.inventory.exception;

public class InsufficientStockException extends RuntimeException {

    private final String variantId;
    private final int requested;
    private final int available;

    public InsufficientStockException(String variantId, int requested, int available) {
        super(String.format("Insufficient stock for variant '%s'. Requested: %d, Available: %d", variantId, requested, available));
        this.variantId = variantId;
        this.requested = requested;
        this.available = available;
    }

    public String getVariantId() { return variantId; }
    public int getRequested() { return requested; }
    public int getAvailable() { return available; }
}
