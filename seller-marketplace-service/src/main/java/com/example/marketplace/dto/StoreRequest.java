package com.example.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StoreRequest(
        @NotBlank(message = "Store name is required")
        @Size(max = 128)
        String storeName,

        @NotBlank(message = "Slug is required")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase alphanumeric characters and hyphens")
        @Size(max = 128)
        String slug,

        String description,
        String logoUrl,
        String bannerUrl
) {}
