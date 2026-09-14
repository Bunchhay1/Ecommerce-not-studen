package com.example.marketplace.repository;

import com.example.marketplace.entity.SellerOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerOfferRepository extends JpaRepository<SellerOffer, UUID> {

    List<SellerOffer> findByListingId(UUID listingId);

    List<SellerOffer> findBySellerId(UUID sellerId);

    Optional<SellerOffer> findByListingIdAndSellerId(UUID listingId, UUID sellerId);
}
