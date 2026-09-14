package com.example.marketplace.dto;

import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;
import com.example.marketplace.enums.ListingStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ListingResponse(
        UUID id,
        UUID sellerId,
        String productId,
        String variantId,
        String sellerSku,
        String listingTitle,
        ItemCondition condition,
        BigDecimal priceReference,
        ListingStatus status,
        FulfillmentType fulfillmentType,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ListingResponse fromEntity(SellerListing listing) {
        return new ListingResponse(
                listing.getId(),
                listing.getSellerId(),
                listing.getProductId(),
                listing.getVariantId(),
                listing.getSellerSku(),
                listing.getListingTitle(),
                listing.getCondition(),
                listing.getPriceReference(),
                listing.getStatus(),
                listing.getFulfillmentType(),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }
}
