package com.example.marketplace.dto;

import com.example.marketplace.entity.SellerStore;
import com.example.marketplace.enums.StoreStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StoreResponse(
        UUID id,
        UUID sellerId,
        String storeName,
        String slug,
        String description,
        String logoUrl,
        String bannerUrl,
        StoreStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static StoreResponse fromEntity(SellerStore store) {
        return new StoreResponse(
                store.getId(),
                store.getSellerId(),
                store.getStoreName(),
                store.getSlug(),
                store.getDescription(),
                store.getLogoUrl(),
                store.getBannerUrl(),
                store.getStatus(),
                store.getCreatedAt(),
                store.getUpdatedAt()
        );
    }
}
