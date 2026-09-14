package com.example.catalog.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CategoryResponse {
    private String id;
    private String parentId;
    private String name;
    private String slug;
    private String description;
    private String status;
    private List<CategoryResponse> subCategories = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public CategoryResponse() {}

    public CategoryResponse(String id, String parentId, String name, String slug, String description,
                            String status, List<CategoryResponse> subCategories, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.status = status;
        this.subCategories = subCategories != null ? subCategories : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public List<CategoryResponse> getSubCategories() { return subCategories; }
    public void setSubCategories(List<CategoryResponse> subCategories) { this.subCategories = subCategories; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String parentId;
        private String name;
        private String slug;
        private String description;
        private String status;
        private List<CategoryResponse> subCategories = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder parentId(String parentId) { this.parentId = parentId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder subCategories(List<CategoryResponse> subCategories) { this.subCategories = subCategories; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public CategoryResponse build() {
            return new CategoryResponse(id, parentId, name, slug, description, status, subCategories, createdAt, updatedAt);
        }
    }
}
