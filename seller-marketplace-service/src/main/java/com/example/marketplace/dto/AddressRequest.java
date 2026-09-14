package com.example.marketplace.dto;

import com.example.marketplace.enums.AddressType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotNull(message = "Address type is required")
        AddressType type,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 255)
        String addressLine1,

        String addressLine2,

        @NotBlank(message = "City is required")
        @Size(max = 100)
        String city,

        String province,

        @Size(min = 2, max = 3)
        String country,

        @NotBlank(message = "Postal code is required")
        @Size(max = 20)
        String postalCode,

        boolean isDefault
) {}
