package com.example.marketplace.dto;

import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductSellerListingResponse(
        String productId,
        int totalSellers,
        List<SellerEntry> sellers
) {
    public record SellerEntry(
            UUID sellerId,
            String sellerCode,
            String sellerName,
            String storeName,
            String storeSlug,
            UUID listingId,
            String variantId,
            String sellerSku,
            ItemCondition condition,
            BigDecimal priceReference,
            FulfillmentType fulfillmentType,
            BigDecimal sellerRating
    ) {}
}
