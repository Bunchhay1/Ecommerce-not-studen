package com.example.catalog.dto;

import com.example.catalog.entity.ProductStatus;
import jakarta.validation.constraints.NotNull;

public class ProductStatusUpdateRequest {

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    public ProductStatusUpdateRequest() {}

    public ProductStatusUpdateRequest(ProductStatus status) {
        this.status = status;
    }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private ProductStatus status;

        public Builder status(ProductStatus status) { this.status = status; return this; }

        public ProductStatusUpdateRequest build() {
            return new ProductStatusUpdateRequest(status);
        }
    }
}
