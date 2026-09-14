package com.example.marketplace.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CommissionRuleRequest(
        String categoryId,
        UUID sellerId,

        @NotNull(message = "Percentage is required")
        @DecimalMin("0.00")
        @DecimalMax("100.00")
        BigDecimal percentage,

        BigDecimal fixedAmount,
        OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo
) {}
