package com.example.marketplace.dto;

import com.example.marketplace.entity.Seller;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.enums.VerificationStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SellerResponse(
        UUID id,
        String userId,
        String sellerCode,
        String displayName,
        String legalName,
        String businessName,
        String email,
        String phone,
        String country,
        SellerStatus status,
        VerificationStatus verificationStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static SellerResponse fromEntity(Seller seller) {
        return new SellerResponse(
                seller.getId(),
                seller.getUserId(),
                seller.getSellerCode(),
                seller.getDisplayName(),
                seller.getLegalName(),
                seller.getBusinessName(),
                seller.getEmail(),
                seller.getPhone(),
                seller.getCountry(),
                seller.getStatus(),
                seller.getVerificationStatus(),
                seller.getCreatedAt(),
                seller.getUpdatedAt()
        );
    }
}
