package com.example.marketplace.kafka;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.entity.ProductCatalogReference;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.performance.service.PerformanceService;
import com.example.marketplace.repository.ProductCatalogReferenceRepository;
import com.example.marketplace.repository.SellerListingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
public class KafkaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventConsumer.class);

    private final ProductCatalogReferenceRepository catalogReferenceRepository;
    private final SellerListingRepository listingRepository;
    private final PerformanceService performanceService;
    private final RedisCacheService cacheService;
    private final ObjectMapper objectMapper;

    public KafkaEventConsumer(ProductCatalogReferenceRepository catalogReferenceRepository,
                              SellerListingRepository listingRepository,
                              PerformanceService performanceService,
                              RedisCacheService cacheService,
                              ObjectMapper objectMapper) {
        this.catalogReferenceRepository = catalogReferenceRepository;
        this.listingRepository = listingRepository;
        this.performanceService = performanceService;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "${app.kafka.topics.catalog-events:catalog.product.events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeCatalogEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.path("eventType").asText(root.path("event_type").asText());
            JsonNode data = root.has("data") ? root.path("data") : root;

            String productId = data.path("productId").asText(data.path("product_id").asText(data.path("id").asText()));
            if (productId == null || productId.isBlank()) return;

            if ("ProductCreated".equalsIgnoreCase(eventType) || "ProductUpdated".equalsIgnoreCase(eventType)) {
                ProductCatalogReference ref = catalogReferenceRepository.findById(productId)
                        .orElseGet(() -> {
                            ProductCatalogReference r = new ProductCatalogReference();
                            r.setProductId(productId);
                            return r;
                        });
                ref.setName(data.path("name").asText(""));
                ref.setCategoryId(data.path("categoryId").asText(data.path("category_id").asText(null)));
                ref.setCategoryName(data.path("categoryName").asText(data.path("category_name").asText(null)));
                ref.setBrand(data.path("brand").asText(null));
                ref.setActive(data.path("isActive").asBoolean(data.path("is_active").asBoolean(true)));
                catalogReferenceRepository.save(ref);
                log.info("Synchronized catalog product reference: {}", productId);
            } else if ("ProductDeleted".equalsIgnoreCase(eventType)) {
                catalogReferenceRepository.findById(productId).ifPresent(ref -> {
                    ref.setActive(false);
                    catalogReferenceRepository.save(ref);
                });
                // Pause all active listings for this deleted product
                List<SellerListing> listings = listingRepository.findByProductIdAndStatus(productId, ListingStatus.ACTIVE);
                for (SellerListing listing : listings) {
                    listing.setStatus(ListingStatus.PAUSED);
                    listingRepository.save(listing);
                }
                cacheService.delete("product:sellers:" + productId);
                log.info("Product {} deleted in catalog; paused {} seller listings", productId, listings.size());
            }
        } catch (Exception e) {
            log.error("Error processing catalog event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.order-events:order.events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeOrderEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.path("eventType").asText(root.path("event_type").asText());
            JsonNode data = root.has("data") ? root.path("data") : root;

            if ("OrderCompleted".equalsIgnoreCase(eventType)) {
                JsonNode items = data.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        String sellerIdStr = item.path("sellerId").asText(item.path("seller_id").asText(null));
                        if (sellerIdStr != null && !sellerIdStr.isBlank()) {
                            try {
                                UUID sellerId = UUID.fromString(sellerIdStr);
                                performanceService.recordOrderCompleted(sellerId);
                            } catch (IllegalArgumentException ignored) {}
                        }
                    }
                }
            } else if ("OrderCancelled".equalsIgnoreCase(eventType)) {
                JsonNode items = data.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        String sellerIdStr = item.path("sellerId").asText(item.path("seller_id").asText(null));
                        if (sellerIdStr != null && !sellerIdStr.isBlank()) {
                            try {
                                UUID sellerId = UUID.fromString(sellerIdStr);
                                performanceService.recordOrderCancelled(sellerId);
                            } catch (IllegalArgumentException ignored) {}
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing order event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.inventory-events:inventory.events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeInventoryEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.path("eventType").asText(root.path("event_type").asText());
            JsonNode data = root.has("data") ? root.path("data") : root;

            String listingIdStr = data.path("listingId").asText(data.path("listing_id").asText(null));
            if (listingIdStr != null && !listingIdStr.isBlank()) {
                UUID listingId = UUID.fromString(listingIdStr);
                listingRepository.findById(listingId).ifPresent(listing -> {
                    if ("StockOut".equalsIgnoreCase(eventType)) {
                        listing.setStatus(ListingStatus.OUT_OF_STOCK);
                        listingRepository.save(listing);
                        cacheService.delete("product:sellers:" + listing.getProductId());
                    } else if ("StockAvailable".equalsIgnoreCase(eventType) && listing.getStatus() == ListingStatus.OUT_OF_STOCK) {
                        listing.setStatus(ListingStatus.ACTIVE);
                        listingRepository.save(listing);
                        cacheService.delete("product:sellers:" + listing.getProductId());
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error processing inventory event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.review-events:review.events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeReviewEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            JsonNode data = root.has("data") ? root.path("data") : root;

            String sellerIdStr = data.path("sellerId").asText(data.path("seller_id").asText(null));
            if (sellerIdStr != null && !sellerIdStr.isBlank() && data.has("rating")) {
                UUID sellerId = UUID.fromString(sellerIdStr);
                BigDecimal rating = BigDecimal.valueOf(data.path("rating").asDouble());
                performanceService.updateRating(sellerId, rating);
            }
        } catch (Exception e) {
            log.error("Error processing review event: {}", e.getMessage(), e);
        }
    }
}
