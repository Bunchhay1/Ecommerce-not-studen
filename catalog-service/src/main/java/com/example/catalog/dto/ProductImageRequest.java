package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public class ProductImageRequest {

    @NotBlank(message = "Image URL is required")
    private String url;

    private String altText;

    private Integer sortOrder = 0;

    private Boolean isPrimary = false;

    public ProductImageRequest() {}

    public ProductImageRequest(String url, String altText, Integer sortOrder, Boolean isPrimary) {
        this.url = url;
        this.altText = altText;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.isPrimary = isPrimary != null ? isPrimary : false;
    }

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
        private String url;
        private String altText;
        private Integer sortOrder = 0;
        private Boolean isPrimary = false;

        public Builder url(String url) { this.url = url; return this; }
        public Builder altText(String altText) { this.altText = altText; return this; }
        public Builder sortOrder(Integer sortOrder) { this.sortOrder = sortOrder; return this; }
        public Builder isPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; return this; }

        public ProductImageRequest build() {
            return new ProductImageRequest(url, altText, sortOrder, isPrimary);
        }
    }
}
