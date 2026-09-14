package com.example.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerRegisterRequest(
        @NotBlank(message = "Display name is required")
        @Size(max = 128)
        String displayName,

        @NotBlank(message = "Legal name is required")
        @Size(max = 255)
        String legalName,

        @NotBlank(message = "Business name is required")
        @Size(max = 255)
        String businessName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        String phone,

        @Size(min = 2, max = 3, message = "Country must be a valid ISO code")
        String country
) {}
