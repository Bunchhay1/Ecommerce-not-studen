package com.example.marketplace.repository;

import com.example.marketplace.entity.CommissionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommissionRuleRepository extends JpaRepository<CommissionRule, UUID> {

    List<CommissionRule> findByStatus(String status);

    @Query("SELECT c FROM CommissionRule c WHERE c.status = 'ACTIVE' AND " +
           "(c.sellerId = :sellerId OR (c.sellerId IS NULL AND (c.categoryId = :categoryId OR c.categoryId IS NULL))) " +
           "ORDER BY c.sellerId DESC, c.categoryId DESC")
    List<CommissionRule> findApplicableRules(@Param("categoryId") String categoryId,
                                            @Param("sellerId") UUID sellerId);
}
