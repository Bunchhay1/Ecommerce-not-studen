package com.example.marketplace.dto;

public record SellerUpdateRequest(
        String displayName,
        String businessName,
        String phone,
        String country
) {}
