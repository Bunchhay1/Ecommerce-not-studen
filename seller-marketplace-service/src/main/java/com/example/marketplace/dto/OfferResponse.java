package com.example.marketplace.dto;

import com.example.marketplace.entity.SellerOffer;
import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OfferResponse(
        UUID id,
        UUID listingId,
        UUID sellerId,
        String currency,
        BigDecimal price,
        ItemCondition condition,
        FulfillmentType fulfillmentType,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static OfferResponse fromEntity(SellerOffer offer) {
        return new OfferResponse(
                offer.getId(),
                offer.getListingId(),
                offer.getSellerId(),
                offer.getCurrency(),
                offer.getPrice(),
                offer.getCondition(),
                offer.getFulfillmentType(),
                offer.getStatus(),
                offer.getCreatedAt(),
                offer.getUpdatedAt()
        );
    }
}
