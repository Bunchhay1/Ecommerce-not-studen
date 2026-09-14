package com.example.catalog.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VariantAttribute> attributes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ProductVariant() {}

    public ProductVariant(String id, Product product, String sku, String status,
                          List<VariantAttribute> attributes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.product = product;
        this.sku = sku;
        this.status = status != null ? status : "ACTIVE";
        this.attributes = attributes != null ? attributes : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<VariantAttribute> getAttributes() { return attributes; }
    public void setAttributes(List<VariantAttribute> attributes) { this.attributes = attributes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private Product product;
        private String sku;
        private String status = "ACTIVE";
        private List<VariantAttribute> attributes = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder product(Product product) { this.product = product; return this; }
        public Builder sku(String sku) { this.sku = sku; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder attributes(List<VariantAttribute> attributes) { this.attributes = attributes; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public ProductVariant build() {
            return new ProductVariant(id, product, sku, status, attributes, createdAt, updatedAt);
        }
    }
}
