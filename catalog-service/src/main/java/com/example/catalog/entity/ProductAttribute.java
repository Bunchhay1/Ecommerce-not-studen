package com.example.catalog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "product_attributes")
public class ProductAttribute {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "attribute_name", nullable = false, length = 100)
    private String name;

    @Column(name = "attribute_value", columnDefinition = "TEXT", nullable = false)
    private String value;

    public ProductAttribute() {}

    public ProductAttribute(String id, Product product, String name, String value) {
        this.id = id;
        this.product = product;
        this.name = name;
        this.value = value;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private Product product;
        private String name;
        private String value;

        public Builder id(String id) { this.id = id; return this; }
        public Builder product(Product product) { this.product = product; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder value(String value) { this.value = value; return this; }

        public ProductAttribute build() {
            return new ProductAttribute(id, product, name, value);
        }
    }
}
