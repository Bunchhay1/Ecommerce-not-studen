package com.example.marketplace.marketplace;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.ProductSellerListingResponse;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.entity.SellerPerformance;
import com.example.marketplace.entity.SellerStore;
import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.marketplace.service.MarketplaceService;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerPerformanceRepository;
import com.example.marketplace.repository.SellerRepository;
import com.example.marketplace.repository.SellerStoreRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketplaceServiceTest {

    @Mock
    private SellerListingRepository listingRepository;
    @Mock
    private SellerRepository sellerRepository;
    @Mock
    private SellerStoreRepository storeRepository;
    @Mock
    private SellerPerformanceRepository performanceRepository;
    @Mock
    private RedisCacheService cacheService;

    @InjectMocks
    private MarketplaceService marketplaceService;

    @Test
    void testGetSellersForProduct_ReturnsSortedActiveSellers() {
        String productId = "prod-iphone-17";
        UUID sellerAId = UUID.randomUUID();
        UUID sellerBId = UUID.randomUUID();

        // Listing A: $999
        SellerListing listingA = new SellerListing();
        listingA.setId(UUID.randomUUID());
        listingA.setSellerId(sellerAId);
        listingA.setProductId(productId);
        listingA.setVariantId("var-256");
        listingA.setSellerSku("SKU-A");
        listingA.setPriceReference(new BigDecimal("999.00"));
        listingA.setCondition(ItemCondition.NEW);
        listingA.setFulfillmentType(FulfillmentType.SELLER);
        listingA.setStatus(ListingStatus.ACTIVE);

        // Listing B: $979 (cheaper, should rank first)
        SellerListing listingB = new SellerListing();
        listingB.setId(UUID.randomUUID());
        listingB.setSellerId(sellerBId);
        listingB.setProductId(productId);
        listingB.setVariantId("var-256");
        listingB.setSellerSku("SKU-B");
        listingB.setPriceReference(new BigDecimal("979.00"));
        listingB.setCondition(ItemCondition.NEW);
        listingB.setFulfillmentType(FulfillmentType.MARKETPLACE);
        listingB.setStatus(ListingStatus.ACTIVE);

        when(cacheService.get(eq("product:sellers:" + productId), eq(ProductSellerListingResponse.class)))
                .thenReturn(Optional.empty());

        when(listingRepository.findByProductIdAndStatus(productId, ListingStatus.ACTIVE))
                .thenReturn(List.of(listingA, listingB));

        Seller sellerA = new Seller();
        sellerA.setId(sellerAId);
        sellerA.setSellerCode("SELLER-A");
        sellerA.setDisplayName("Seller A Electronics");
        sellerA.setStatus(SellerStatus.ACTIVE);

        Seller sellerB = new Seller();
        sellerB.setId(sellerBId);
        sellerB.setSellerCode("SELLER-B");
        sellerB.setDisplayName("Seller B Official");
        sellerB.setStatus(SellerStatus.ACTIVE);

        when(sellerRepository.findAllById(any())).thenReturn(List.of(sellerA, sellerB));

        SellerPerformance perfA = new SellerPerformance();
        perfA.setAverageRating(new BigDecimal("4.80"));
        when(performanceRepository.findBySellerId(sellerAId)).thenReturn(Optional.of(perfA));

        SellerPerformance perfB = new SellerPerformance();
        perfB.setAverageRating(new BigDecimal("4.60"));
        when(performanceRepository.findBySellerId(sellerBId)).thenReturn(Optional.of(perfB));

        ProductSellerListingResponse response = marketplaceService.getSellersForProduct(productId);

        assertNotNull(response);
        assertEquals(productId, response.productId());
        assertEquals(2, response.totalSellers());

        // First seller should be Seller B ($979 vs $999)
        assertEquals(sellerBId, response.sellers().get(0).sellerId());
        assertEquals(new BigDecimal("979.00"), response.sellers().get(0).priceReference());

        // Second seller should be Seller A
        assertEquals(sellerAId, response.sellers().get(1).sellerId());
        assertEquals(new BigDecimal("999.00"), response.sellers().get(1).priceReference());
    }
}
