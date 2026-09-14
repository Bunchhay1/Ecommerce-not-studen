package com.example.catalog.dto;

import com.example.catalog.entity.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class ProductRequest {

    private String brandId;

    private String categoryId;

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Slug must not exceed 255 characters")
    private String slug;

    private String description;

    private ProductStatus status = ProductStatus.DRAFT;

    private List<ProductAttributeRequest> attributes = new ArrayList<>();

    private List<ProductImageRequest> images = new ArrayList<>();

    private List<ProductVariantRequest> variants = new ArrayList<>();

    public ProductRequest() {}

    public ProductRequest(String brandId, String categoryId, String name, String slug, String description,
                          ProductStatus status, List<ProductAttributeRequest> attributes,
                          List<ProductImageRequest> images, List<ProductVariantRequest> variants) {
        this.brandId = brandId;
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.status = status != null ? status : ProductStatus.DRAFT;
        this.attributes = attributes != null ? attributes : new ArrayList<>();
        this.images = images != null ? images : new ArrayList<>();
        this.variants = variants != null ? variants : new ArrayList<>();
    }

    public String getBrandId() { return brandId; }
    public void setBrandId(String brandId) { this.brandId = brandId; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public List<ProductAttributeRequest> getAttributes() { return attributes; }
    public void setAttributes(List<ProductAttributeRequest> attributes) { this.attributes = attributes; }

    public List<ProductImageRequest> getImages() { return images; }
    public void setImages(List<ProductImageRequest> images) { this.images = images; }

    public List<ProductVariantRequest> getVariants() { return variants; }
    public void setVariants(List<ProductVariantRequest> variants) { this.variants = variants; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String brandId;
        private String categoryId;
        private String name;
        private String slug;
        private String description;
        private ProductStatus status = ProductStatus.DRAFT;
        private List<ProductAttributeRequest> attributes = new ArrayList<>();
        private List<ProductImageRequest> images = new ArrayList<>();
        private List<ProductVariantRequest> variants = new ArrayList<>();

        public Builder brandId(String brandId) { this.brandId = brandId; return this; }
        public Builder categoryId(String categoryId) { this.categoryId = categoryId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(ProductStatus status) { this.status = status; return this; }
        public Builder attributes(List<ProductAttributeRequest> attributes) { this.attributes = attributes; return this; }
        public Builder images(List<ProductImageRequest> images) { this.images = images; return this; }
        public Builder variants(List<ProductVariantRequest> variants) { this.variants = variants; return this; }

        public ProductRequest build() {
            return new ProductRequest(brandId, categoryId, name, slug, description, status, attributes, images, variants);
        }
    }
}
