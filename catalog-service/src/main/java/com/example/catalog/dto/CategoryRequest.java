package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    private String parentId;

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String name;

    @Size(max = 120, message = "Slug must not exceed 120 characters")
    private String slug;

    private String description;

    private String status = "ACTIVE";

    public CategoryRequest() {}

    public CategoryRequest(String parentId, String name, String slug, String description, String status) {
        this.parentId = parentId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.status = status != null ? status : "ACTIVE";
    }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String parentId;
        private String name;
        private String slug;
        private String description;
        private String status = "ACTIVE";

        public Builder parentId(String parentId) { this.parentId = parentId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(String status) { this.status = status; return this; }

        public CategoryRequest build() {
            return new CategoryRequest(parentId, name, slug, description, status);
        }
    }
}
