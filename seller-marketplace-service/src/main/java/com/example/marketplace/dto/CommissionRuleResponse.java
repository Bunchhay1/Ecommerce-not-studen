package com.example.marketplace.dto;

import com.example.marketplace.entity.CommissionRule;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CommissionRuleResponse(
        UUID id,
        String categoryId,
        UUID sellerId,
        BigDecimal percentage,
        BigDecimal fixedAmount,
        String status,
        OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CommissionRuleResponse fromEntity(CommissionRule rule) {
        return new CommissionRuleResponse(
                rule.getId(),
                rule.getCategoryId(),
                rule.getSellerId(),
                rule.getPercentage(),
                rule.getFixedAmount(),
                rule.getStatus(),
                rule.getEffectiveFrom(),
                rule.getEffectiveTo(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
