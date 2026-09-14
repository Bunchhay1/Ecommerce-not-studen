package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

public class ProductVariantRequest {

    @NotBlank(message = "SKU is required")
    @Size(max = 100, message = "SKU must not exceed 100 characters")
    private String sku;

    private String status = "ACTIVE";

    private Map<String, String> attributes = new HashMap<>();

    public ProductVariantRequest() {}

    public ProductVariantRequest(String sku, String status, Map<String, String> attributes) {
        this.sku = sku;
        this.status = status != null ? status : "ACTIVE";
        this.attributes = attributes != null ? attributes : new HashMap<>();
    }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, String> getAttributes() { return attributes; }
    public void setAttributes(Map<String, String> attributes) { this.attributes = attributes; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String sku;
        private String status = "ACTIVE";
        private Map<String, String> attributes = new HashMap<>();

        public Builder sku(String sku) { this.sku = sku; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder attributes(Map<String, String> attributes) { this.attributes = attributes; return this; }

        public ProductVariantRequest build() {
            return new ProductVariantRequest(sku, status, attributes);
        }
    }
}
