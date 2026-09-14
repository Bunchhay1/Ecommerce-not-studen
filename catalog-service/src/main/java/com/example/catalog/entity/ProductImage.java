package com.example.catalog.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "product_images")
public class ProductImage {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String url;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ProductImage() {}

    public ProductImage(String id, Product product, String url, String altText,
                        Integer sortOrder, Boolean isPrimary, Instant createdAt) {
        this.id = id;
        this.product = product;
        this.url = url;
        this.altText = altText;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.isPrimary = isPrimary != null ? isPrimary : false;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getAltText() { return altText; }
    public void setAltText(String altText) { this.altText = altText; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean primary) { isPrimary = primary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private Product product;
        private String url;
        private String altText;
        private Integer sortOrder = 0;
        private Boolean isPrimary = false;
        private Instant createdAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder product(Product product) { this.product = product; return this; }
        public Builder url(String url) { this.url = url; return this; }
        public Builder altText(String altText) { this.altText = altText; return this; }
        public Builder sortOrder(Integer sortOrder) { this.sortOrder = sortOrder; return this; }
        public Builder isPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public ProductImage build() {
            return new ProductImage(id, product, url, altText, sortOrder, isPrimary, createdAt);
        }
    }
}
