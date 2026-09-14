package com.example.catalog.dto;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class ProductVariantResponse {
    private String id;
    private String productId;
    private String sku;
    private String status;
    private Map<String, String> attributes = new HashMap<>();
    private Instant createdAt;
    private Instant updatedAt;

    public ProductVariantResponse() {}

    public ProductVariantResponse(String id, String productId, String sku, String status,
                                  Map<String, String> attributes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.productId = productId;
        this.sku = sku;
        this.status = status;
        this.attributes = attributes != null ? attributes : new HashMap<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, String> getAttributes() { return attributes; }
    public void setAttributes(Map<String, String> attributes) { this.attributes = attributes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String productId;
        private String sku;
        private String status;
        private Map<String, String> attributes = new HashMap<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder productId(String productId) { this.productId = productId; return this; }
        public Builder sku(String sku) { this.sku = sku; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder attributes(Map<String, String> attributes) { this.attributes = attributes; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public ProductVariantResponse build() {
            return new ProductVariantResponse(id, productId, sku, status, attributes, createdAt, updatedAt);
        }
    }
}
