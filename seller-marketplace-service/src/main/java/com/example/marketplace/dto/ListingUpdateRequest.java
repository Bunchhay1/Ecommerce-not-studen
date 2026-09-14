package com.example.marketplace.dto;

import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;

import java.math.BigDecimal;

public record ListingUpdateRequest(
        String listingTitle,
        ItemCondition condition,
        BigDecimal priceReference,
        FulfillmentType fulfillmentType
) {}
