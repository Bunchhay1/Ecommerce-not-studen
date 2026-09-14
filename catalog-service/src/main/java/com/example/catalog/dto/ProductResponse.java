package com.example.catalog.dto;

import com.example.catalog.entity.ProductStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ProductResponse {
    private String id;
    private BrandResponse brand;
    private CategoryResponse category;
    private String name;
    private String slug;
    private String description;
    private ProductStatus status;
    private List<ProductAttributeResponse> attributes = new ArrayList<>();
    private List<ProductImageResponse> images = new ArrayList<>();
    private List<ProductVariantResponse> variants = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public ProductResponse() {}

    public ProductResponse(String id, BrandResponse brand, CategoryResponse category, String name,
                           String slug, String description, ProductStatus status,
                           List<ProductAttributeResponse> attributes, List<ProductImageResponse> images,
                           List<ProductVariantResponse> variants, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.brand = brand;
        this.category = category;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.status = status;
        this.attributes = attributes != null ? attributes : new ArrayList<>();
        this.images = images != null ? images : new ArrayList<>();
        this.variants = variants != null ? variants : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public BrandResponse getBrand() { return brand; }
    public void setBrand(BrandResponse brand) { this.brand = brand; }

    public CategoryResponse getCategory() { return category; }
    public void setCategory(CategoryResponse category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public List<ProductAttributeResponse> getAttributes() { return attributes; }
    public void setAttributes(List<ProductAttributeResponse> attributes) { this.attributes = attributes; }

    public List<ProductImageResponse> getImages() { return images; }
    public void setImages(List<ProductImageResponse> images) { this.images = images; }

    public List<ProductVariantResponse> getVariants() { return variants; }
    public void setVariants(List<ProductVariantResponse> variants) { this.variants = variants; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private BrandResponse brand;
        private CategoryResponse category;
        private String name;
        private String slug;
        private String description;
        private ProductStatus status;
        private List<ProductAttributeResponse> attributes = new ArrayList<>();
        private List<ProductImageResponse> images = new ArrayList<>();
        private List<ProductVariantResponse> variants = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder brand(BrandResponse brand) { this.brand = brand; return this; }
        public Builder category(CategoryResponse category) { this.category = category; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(ProductStatus status) { this.status = status; return this; }
        public Builder attributes(List<ProductAttributeResponse> attributes) { this.attributes = attributes; return this; }
        public Builder images(List<ProductImageResponse> images) { this.images = images; return this; }
        public Builder variants(List<ProductVariantResponse> variants) { this.variants = variants; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public ProductResponse build() {
            return new ProductResponse(id, brand, category, name, slug, description, status, attributes, images, variants, createdAt, updatedAt);
        }
    }
}
