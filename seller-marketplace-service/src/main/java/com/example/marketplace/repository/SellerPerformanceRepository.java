package com.example.marketplace.repository;

import com.example.marketplace.entity.SellerPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerPerformanceRepository extends JpaRepository<SellerPerformance, UUID> {

    Optional<SellerPerformance> findBySellerId(UUID sellerId);
}
