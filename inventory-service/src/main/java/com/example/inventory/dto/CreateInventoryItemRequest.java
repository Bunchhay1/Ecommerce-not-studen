package com.example.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateInventoryItemRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Variant ID is required")
    private String variantId;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Total quantity is required")
    @Min(value = 0, message = "Total quantity must be greater than or equal to 0")
    private Integer totalQuantity = 0;

    @Min(value = 0, message = "Low stock threshold must be greater than or equal to 0")
    private Integer lowStockThreshold = 10;

    public CreateInventoryItemRequest() {
    }

    public CreateInventoryItemRequest(String productId, String variantId, String sku, Integer totalQuantity, Integer lowStockThreshold) {
        this.productId = productId;
        this.variantId = variantId;
        this.sku = sku;
        this.totalQuantity = totalQuantity;
        this.lowStockThreshold = lowStockThreshold;
    }

    // Getters and Setters
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getVariantId() { return variantId; }
    public void setVariantId(String variantId) { this.variantId = variantId; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }
}
