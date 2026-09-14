package com.example.catalog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "variant_attributes")
public class VariantAttribute {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String value;

    public VariantAttribute() {}

    public VariantAttribute(String id, ProductVariant variant, String name, String value) {
        this.id = id;
        this.variant = variant;
        this.name = name;
        this.value = value;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private ProductVariant variant;
        private String name;
        private String value;

        public Builder id(String id) { this.id = id; return this; }
        public Builder variant(ProductVariant variant) { this.variant = variant; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder value(String value) { this.value = value; return this; }

        public VariantAttribute build() {
            return new VariantAttribute(id, variant, name, value);
        }
    }
}
