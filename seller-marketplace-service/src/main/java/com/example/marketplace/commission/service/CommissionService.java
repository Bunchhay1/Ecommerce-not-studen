package com.example.marketplace.commission.service;

import com.example.marketplace.dto.CommissionCalculationResponse;
import com.example.marketplace.dto.CommissionRuleRequest;
import com.example.marketplace.dto.CommissionRuleResponse;
import com.example.marketplace.entity.CommissionRule;
import com.example.marketplace.repository.CommissionRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommissionService {

    private final CommissionRuleRepository commissionRuleRepository;

    public CommissionService(CommissionRuleRepository commissionRuleRepository) {
        this.commissionRuleRepository = commissionRuleRepository;
    }

    @Transactional
    public CommissionRuleResponse createRule(CommissionRuleRequest request) {
        CommissionRule rule = new CommissionRule();
        rule.setCategoryId(request.categoryId());
        rule.setSellerId(request.sellerId());
        rule.setPercentage(request.percentage());
        rule.setFixedAmount(request.fixedAmount() != null ? request.fixedAmount() : BigDecimal.ZERO);
        rule.setStatus("ACTIVE");
        if (request.effectiveFrom() != null) {
            rule.setEffectiveFrom(request.effectiveFrom());
        }
        rule.setEffectiveTo(request.effectiveTo());

        CommissionRule saved = commissionRuleRepository.save(rule);
        return CommissionRuleResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<CommissionRuleResponse> getAllActiveRules() {
        return commissionRuleRepository.findByStatus("ACTIVE")
                .stream()
                .map(CommissionRuleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CommissionCalculationResponse calculateCommission(UUID sellerId, String categoryId, BigDecimal grossAmount) {
        List<CommissionRule> rules = commissionRuleRepository.findApplicableRules(categoryId, sellerId);

        BigDecimal rate = new BigDecimal("10.00"); // Default 10%
        BigDecimal fixedFee = BigDecimal.ZERO;

        if (!rules.isEmpty()) {
            CommissionRule bestMatch = rules.get(0);
            rate = bestMatch.getPercentage();
            if (bestMatch.getFixedAmount() != null) {
                fixedFee = bestMatch.getFixedAmount();
            }
        }

        BigDecimal percentageFee = grossAmount.multiply(rate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal totalCommission = percentageFee.add(fixedFee);
        BigDecimal sellerNet = grossAmount.subtract(totalCommission);

        return new CommissionCalculationResponse(
                sellerId,
                categoryId,
                grossAmount,
                rate,
                totalCommission,
                sellerNet
        );
    }
}
