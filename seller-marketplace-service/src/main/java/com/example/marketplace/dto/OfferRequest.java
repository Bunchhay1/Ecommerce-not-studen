package com.example.marketplace.dto;

import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record OfferRequest(
        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        String currency,
        ItemCondition condition,
        FulfillmentType fulfillmentType
) {}
