package com.example.catalog.dto;

public class ProductAttributeResponse {
    private String id;
    private String name;
    private String value;

    public ProductAttributeResponse() {}

    public ProductAttributeResponse(String id, String name, String value) {
        this.id = id;
        this.name = name;
        this.value = value;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String name;
        private String value;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder value(String value) { this.value = value; return this; }

        public ProductAttributeResponse build() {
            return new ProductAttributeResponse(id, name, value);
        }
    }
}
