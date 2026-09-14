package com.example.marketplace.marketplace.service;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.ProductSellerListingResponse;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.entity.SellerPerformance;
import com.example.marketplace.entity.SellerStore;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerPerformanceRepository;
import com.example.marketplace.repository.SellerRepository;
import com.example.marketplace.repository.SellerStoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MarketplaceService {

    private final SellerListingRepository listingRepository;
    private final SellerRepository sellerRepository;
    private final SellerStoreRepository storeRepository;
    private final SellerPerformanceRepository performanceRepository;
    private final RedisCacheService cacheService;

    public MarketplaceService(SellerListingRepository listingRepository,
                              SellerRepository sellerRepository,
                              SellerStoreRepository storeRepository,
                              SellerPerformanceRepository performanceRepository,
                              RedisCacheService cacheService) {
        this.listingRepository = listingRepository;
        this.sellerRepository = sellerRepository;
        this.storeRepository = storeRepository;
        this.performanceRepository = performanceRepository;
        this.cacheService = cacheService;
    }

    @Transactional(readOnly = true)
    public ProductSellerListingResponse getSellersForProduct(String productId) {
        String cacheKey = "product:sellers:" + productId;
        return cacheService.get(cacheKey, ProductSellerListingResponse.class)
                .orElseGet(() -> {
                    List<SellerListing> listings = listingRepository.findByProductIdAndStatus(productId, ListingStatus.ACTIVE);

                    if (listings.isEmpty()) {
                        return new ProductSellerListingResponse(productId, 0, List.of());
                    }

                    List<UUID> sellerIds = listings.stream().map(SellerListing::getSellerId).distinct().toList();
                    Map<UUID, Seller> sellerMap = sellerRepository.findAllById(sellerIds)
                            .stream()
                            .collect(Collectors.toMap(Seller::getId, s -> s));

                    List<ProductSellerListingResponse.SellerEntry> entries = new ArrayList<>();

                    for (SellerListing listing : listings) {
                        Seller seller = sellerMap.get(listing.getSellerId());
                        if (seller == null || seller.getStatus() != SellerStatus.ACTIVE) {
                            continue;
                        }

                        SellerStore store = storeRepository.findBySellerId(seller.getId()).orElse(null);
                        SellerPerformance perf = performanceRepository.findBySellerId(seller.getId()).orElse(null);

                        String storeName = store != null ? store.getStoreName() : seller.getDisplayName();
                        String storeSlug = store != null ? store.getSlug() : null;
                        BigDecimal rating = perf != null ? perf.getAverageRating() : new BigDecimal("5.00");

                        entries.add(new ProductSellerListingResponse.SellerEntry(
                                seller.getId(),
                                seller.getSellerCode(),
                                seller.getDisplayName(),
                                storeName,
                                storeSlug,
                                listing.getId(),
                                listing.getVariantId(),
                                listing.getSellerSku(),
                                listing.getCondition(),
                                listing.getPriceReference(),
                                listing.getFulfillmentType(),
                                rating
                        ));
                    }

                    // Sort by price ascending, rating descending
                    entries.sort((a, b) -> {
                        int priceCmp = a.priceReference().compareTo(b.priceReference());
                        if (priceCmp != 0) return priceCmp;
                        return b.sellerRating().compareTo(a.sellerRating());
                    });

                    ProductSellerListingResponse response = new ProductSellerListingResponse(
                            productId,
                            entries.size(),
                            entries
                    );

                    cacheService.set(cacheKey, response, Duration.ofMinutes(15));
                    return response;
                });
    }
}
