package com.example.marketplace.dto;

import com.example.marketplace.entity.SellerAddress;
import com.example.marketplace.enums.AddressType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AddressResponse(
        UUID id,
        UUID sellerId,
        AddressType type,
        String addressLine1,
        String addressLine2,
        String city,
        String province,
        String country,
        String postalCode,
        boolean isDefault,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AddressResponse fromEntity(SellerAddress address) {
        return new AddressResponse(
                address.getId(),
                address.getSellerId(),
                address.getType(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getProvince(),
                address.getCountry(),
                address.getPostalCode(),
                address.isDefault(),
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
