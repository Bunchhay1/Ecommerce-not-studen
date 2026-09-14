package com.example.marketplace.repository;

import com.example.marketplace.entity.SellerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerAddressRepository extends JpaRepository<SellerAddress, UUID> {

    List<SellerAddress> findBySellerId(UUID sellerId);

    Optional<SellerAddress> findBySellerIdAndIsDefaultTrue(UUID sellerId);
}
