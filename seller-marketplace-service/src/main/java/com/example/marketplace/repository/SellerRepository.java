package com.example.marketplace.repository;

import com.example.marketplace.entity.Seller;
import com.example.marketplace.enums.SellerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerRepository extends JpaRepository<Seller, UUID> {

    Optional<Seller> findByUserId(String userId);

    Optional<Seller> findBySellerCode(String sellerCode);

    boolean existsBySellerCode(String sellerCode);

    Page<Seller> findByStatus(SellerStatus status, Pageable pageable);
}
