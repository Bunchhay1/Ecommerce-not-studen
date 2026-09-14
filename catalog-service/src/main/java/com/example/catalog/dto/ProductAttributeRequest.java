package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProductAttributeRequest {

    @NotBlank(message = "Attribute name is required")
    @Size(max = 100, message = "Attribute name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Attribute value is required")
    private String value;

    public ProductAttributeRequest() {}

    public ProductAttributeRequest(String name, String value) {
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

        public ProductAttributeRequest build() {
            return new ProductAttributeRequest(name, value);
        }
    }
}
