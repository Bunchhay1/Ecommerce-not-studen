package com.example.marketplace.commission;

import com.example.marketplace.dto.CommissionCalculationResponse;
import com.example.marketplace.dto.CommissionRuleRequest;
import com.example.marketplace.dto.CommissionRuleResponse;
import com.example.marketplace.entity.CommissionRule;
import com.example.marketplace.repository.CommissionRuleRepository;
import com.example.marketplace.commission.service.CommissionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommissionServiceTest {

    @Mock
    private CommissionRuleRepository commissionRuleRepository;

    @InjectMocks
    private CommissionService commissionService;

    @Test
    void testCalculateCommission_WithMatchingRule() {
        UUID sellerId = UUID.randomUUID();
        String categoryId = "cat-electronics";
        BigDecimal gross = new BigDecimal("500.00");

        CommissionRule rule = new CommissionRule();
        rule.setCategoryId(categoryId);
        rule.setPercentage(new BigDecimal("8.00")); // 8% commission
        rule.setFixedAmount(new BigDecimal("2.00")); // + $2.00 fixed fee

        when(commissionRuleRepository.findApplicableRules(categoryId, sellerId))
                .thenReturn(List.of(rule));

        CommissionCalculationResponse response = commissionService.calculateCommission(sellerId, categoryId, gross);

        assertNotNull(response);
        assertEquals(gross, response.grossAmount());
        assertEquals(new BigDecimal("8.00"), response.commissionRatePercentage());
        // Fee = 500 * 8% = 40.00 + 2.00 = 42.00
        assertEquals(new BigDecimal("42.00"), response.commissionFee());
        // Net = 500.00 - 42.00 = 458.00
        assertEquals(new BigDecimal("458.00"), response.sellerNetAmount());
    }

    @Test
    void testCalculateCommission_DefaultFallback() {
        UUID sellerId = UUID.randomUUID();
        String categoryId = "cat-general";
        BigDecimal gross = new BigDecimal("1000.00");

        when(commissionRuleRepository.findApplicableRules(categoryId, sellerId))
                .thenReturn(List.of());

        CommissionCalculationResponse response = commissionService.calculateCommission(sellerId, categoryId, gross);

        // Default is 10%
        assertEquals(new BigDecimal("10.00"), response.commissionRatePercentage());
        assertEquals(new BigDecimal("100.00"), response.commissionFee());
        assertEquals(new BigDecimal("900.00"), response.sellerNetAmount());
    }
}
