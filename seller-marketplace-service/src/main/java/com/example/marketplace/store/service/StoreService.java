package com.example.marketplace.store.service;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.StoreRequest;
import com.example.marketplace.dto.StoreResponse;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerStore;
import com.example.marketplace.enums.StoreStatus;
import com.example.marketplace.exception.MarketplaceException;
import com.example.marketplace.exception.StoreNotFoundException;
import com.example.marketplace.outbox.EventPublisherService;
import com.example.marketplace.repository.SellerStoreRepository;
import com.example.marketplace.seller.service.SellerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreService.class);

    private final SellerStoreRepository storeRepository;
    private final SellerService sellerService;
    private final EventPublisherService eventPublisher;
    private final RedisCacheService cacheService;

    public StoreService(SellerStoreRepository storeRepository,
                        SellerService sellerService,
                        EventPublisherService eventPublisher,
                        RedisCacheService cacheService) {
        this.storeRepository = storeRepository;
        this.sellerService = sellerService;
        this.eventPublisher = eventPublisher;
        this.cacheService = cacheService;
    }

    @Transactional
    public StoreResponse createOrUpdateStore(String userId, StoreRequest request) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);

        Optional<SellerStore> existingBySlug = storeRepository.findBySlug(request.slug());
        if (existingBySlug.isPresent() && !existingBySlug.get().getSellerId().equals(seller.getId())) {
            throw new MarketplaceException("Store slug '" + request.slug() + "' is already taken",
                    HttpStatus.CONFLICT, "STORE_SLUG_ALREADY_EXISTS");
        }

        SellerStore store = storeRepository.findBySellerId(seller.getId())
                .orElseGet(() -> {
                    SellerStore newStore = new SellerStore();
                    newStore.setSellerId(seller.getId());
                    return newStore;
                });

        store.setStoreName(request.storeName());
        store.setSlug(request.slug());
        store.setDescription(request.description());
        store.setLogoUrl(request.logoUrl());
        store.setBannerUrl(request.bannerUrl());
        store.setStatus(StoreStatus.ACTIVE);

        SellerStore saved = storeRepository.save(store);

        eventPublisher.enqueueEvent(
                "Store",
                saved.getId().toString(),
                "StoreUpdated",
                Map.of(
                        "storeId", saved.getId(),
                        "sellerId", saved.getSellerId(),
                        "slug", saved.getSlug()
                )
        );

        cacheService.set("store:slug:" + saved.getSlug(), StoreResponse.fromEntity(saved), Duration.ofHours(2));
        cacheService.set("store:seller:" + saved.getSellerId(), StoreResponse.fromEntity(saved), Duration.ofHours(2));
        log.info("Saved storefront {} with slug {} for seller {}", saved.getId(), saved.getSlug(), seller.getId());

        return StoreResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public StoreResponse getStoreByUserId(String userId) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);
        return storeRepository.findBySellerId(seller.getId())
                .map(StoreResponse::fromEntity)
                .orElseThrow(() -> new StoreNotFoundException("No store configured for this seller account"));
    }

    @Transactional(readOnly = true)
    public StoreResponse getStoreBySlug(String slug) {
        return cacheService.get("store:slug:" + slug, StoreResponse.class)
                .orElseGet(() -> {
                    SellerStore store = storeRepository.findBySlug(slug)
                            .orElseThrow(() -> new StoreNotFoundException("Store not found with slug: " + slug));
                    StoreResponse response = StoreResponse.fromEntity(store);
                    cacheService.set("store:slug:" + slug, response, Duration.ofHours(2));
                    return response;
                });
    }

    @Transactional(readOnly = true)
    public Optional<SellerStore> findBySellerId(UUID sellerId) {
        return storeRepository.findBySellerId(sellerId);
    }
}
