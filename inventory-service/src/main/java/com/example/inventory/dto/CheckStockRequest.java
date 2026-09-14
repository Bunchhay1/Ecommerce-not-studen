package com.example.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CheckStockRequest {

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<CheckItem> items;

    public CheckStockRequest() {
    }

    public CheckStockRequest(List<CheckItem> items) {
        this.items = items;
    }

    public static class CheckItem {
        @NotBlank(message = "Variant ID is required")
        private String variantId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        public CheckItem() {
        }

        public CheckItem(String variantId, Integer quantity) {
            this.variantId = variantId;
            this.quantity = quantity;
        }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public List<CheckItem> getItems() { return items; }
    public void setItems(List<CheckItem> items) { this.items = items; }
}
