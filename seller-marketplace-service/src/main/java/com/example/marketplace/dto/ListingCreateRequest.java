package com.example.marketplace.dto;

import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ListingCreateRequest(
        @NotBlank(message = "Product ID is required")
        String productId,

        @NotBlank(message = "Variant ID is required")
        String variantId,

        @NotBlank(message = "Seller SKU is required")
        @Size(max = 64)
        String sellerSku,

        @NotBlank(message = "Listing title is required")
        @Size(max = 255)
        String listingTitle,

        @NotNull(message = "Condition is required")
        ItemCondition condition,

        @NotNull(message = "Price reference is required")
        @PositiveOrZero(message = "Price must be greater than or equal to 0")
        BigDecimal priceReference,

        FulfillmentType fulfillmentType
) {}
