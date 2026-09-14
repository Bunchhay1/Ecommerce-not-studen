package com.example.catalog.dto;

public class ProductImageResponse {
    private String id;
    private String url;
    private String altText;
    private Integer sortOrder;
    private Boolean isPrimary;

    public ProductImageResponse() {}

    public ProductImageResponse(String id, String url, String altText, Integer sortOrder, Boolean isPrimary) {
        this.id = id;
        this.url = url;
        this.altText = altText;
        this.sortOrder = sortOrder;
        this.isPrimary = isPrimary;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getAltText() { return altText; }
    public void setAltText(String altText) { this.altText = altText; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean primary) { isPrimary = primary; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String url;
        private String altText;
        private Integer sortOrder;
        private Boolean isPrimary;

        public Builder id(String id) { this.id = id; return this; }
        public Builder url(String url) { this.url = url; return this; }
        public Builder altText(String altText) { this.altText = altText; return this; }
        public Builder sortOrder(Integer sortOrder) { this.sortOrder = sortOrder; return this; }
        public Builder isPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; return this; }

        public ProductImageResponse build() {
            return new ProductImageResponse(id, url, altText, sortOrder, isPrimary);
        }
    }
}
