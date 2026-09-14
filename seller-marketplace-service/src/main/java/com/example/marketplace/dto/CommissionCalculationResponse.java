package com.example.marketplace.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CommissionCalculationResponse(
        UUID sellerId,
        String categoryId,
        BigDecimal grossAmount,
        BigDecimal commissionRatePercentage,
        BigDecimal commissionFee,
        BigDecimal sellerNetAmount
) {}
