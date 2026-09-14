package com.example.marketplace.repository;

import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerListingRepository extends JpaRepository<SellerListing, UUID> {

    Page<SellerListing> findBySellerId(UUID sellerId, Pageable pageable);

    List<SellerListing> findByProductIdAndStatus(String productId, ListingStatus status);

    Optional<SellerListing> findBySellerIdAndVariantId(UUID sellerId, String variantId);

    boolean existsBySellerIdAndVariantId(UUID sellerId, String variantId);

    List<SellerListing> findBySellerId(UUID sellerId);
}
