package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public class ProductAttributeDto {
    @NotBlank(message = "Attribute name is required")
    private String name;

    @NotBlank(message = "Attribute value is required")
    private String value;

    public ProductAttributeDto() {}

    public ProductAttributeDto(String name, String value) {
        this.name = name;
        this.value = value;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;
        private String value;

        public Builder name(String name) { this.name = name; return this; }
        public Builder value(String value) { this.value = value; return this; }

        public ProductAttributeDto build() {
            return new ProductAttributeDto(name, value);
        }
    }
}
