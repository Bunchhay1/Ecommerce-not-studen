package com.example.inventory.dto;

import java.util.List;

public class CheckStockResponse {

    private boolean available;
    private List<CheckStockItemResult> items;

    public CheckStockResponse() {
    }

    public CheckStockResponse(boolean available, List<CheckStockItemResult> items) {
        this.available = available;
        this.items = items;
    }

    public static class CheckStockItemResult {
        private String variantId;
        private int requested;
        private int available;
        private boolean inStock;

        public CheckStockItemResult() {
        }

        public CheckStockItemResult(String variantId, int requested, int available, boolean inStock) {
            this.variantId = variantId;
            this.requested = requested;
            this.available = available;
            this.inStock = inStock;
        }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public int getRequested() { return requested; }
        public void setRequested(int requested) { this.requested = requested; }

        public int getAvailable() { return available; }
        public void setAvailable(int available) { this.available = available; }

        public boolean isInStock() { return inStock; }
        public void setInStock(boolean inStock) { this.inStock = inStock; }
    }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public List<CheckStockItemResult> getItems() { return items; }
    public void setItems(List<CheckStockItemResult> items) { this.items = items; }
}
