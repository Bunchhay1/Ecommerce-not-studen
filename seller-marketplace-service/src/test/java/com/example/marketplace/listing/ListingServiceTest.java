package com.example.marketplace.listing;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.ListingCreateRequest;
import com.example.marketplace.dto.ListingResponse;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ItemCondition;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.exception.MarketplaceException;
import com.example.marketplace.exception.SellerNotActiveException;
import com.example.marketplace.listing.service.ListingService;
import com.example.marketplace.outbox.EventPublisherService;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerOfferRepository;
import com.example.marketplace.seller.service.SellerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private SellerListingRepository listingRepository;
    @Mock
    private SellerOfferRepository offerRepository;
    @Mock
    private SellerService sellerService;
    @Mock
    private EventPublisherService eventPublisher;
    @Mock
    private RedisCacheService cacheService;

    @InjectMocks
    private ListingService listingService;

    private String userId;
    private Seller activeSeller;
    private ListingCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        userId = "user-123";
        activeSeller = new Seller();
        activeSeller.setId(UUID.randomUUID());
        activeSeller.setStatus(SellerStatus.ACTIVE);

        createRequest = new ListingCreateRequest(
                "prod-iphone-17",
                "var-iphone-17-256gb",
                "ABC-IP17-256-BLK",
                "Apple iPhone 17 (256GB, Black) - Brand New",
                ItemCondition.NEW,
                new BigDecimal("999.00"),
                FulfillmentType.SELLER
        );
    }

    @Test
    void testCreateListing_Success() {
        when(sellerService.getSellerEntityByUserId(userId)).thenReturn(activeSeller);
        when(listingRepository.existsBySellerIdAndVariantId(activeSeller.getId(), createRequest.variantId()))
                .thenReturn(false);
        when(listingRepository.save(any(SellerListing.class))).thenAnswer(inv -> {
            SellerListing l = inv.getArgument(0);
            l.setId(UUID.randomUUID());
            return l;
        });

        ListingResponse response = listingService.createListing(userId, createRequest);

        assertNotNull(response);
        assertEquals("prod-iphone-17", response.productId());
        assertEquals(ListingStatus.ACTIVE, response.status());
        assertEquals(new BigDecimal("999.00"), response.priceReference());

        verify(offerRepository, times(1)).save(any());
        verify(eventPublisher, times(1)).enqueueEvent(eq("Listing"), any(), eq("ListingCreated"), any());
    }

    @Test
    void testCreateListing_DuplicateVariantRejected() {
        when(sellerService.getSellerEntityByUserId(userId)).thenReturn(activeSeller);
        when(listingRepository.existsBySellerIdAndVariantId(activeSeller.getId(), createRequest.variantId()))
                .thenReturn(true);

        MarketplaceException ex = assertThrows(MarketplaceException.class, () ->
                listingService.createListing(userId, createRequest));
        assertEquals("LISTING_ALREADY_EXISTS", ex.getErrorCode());
    }

    @Test
    void testCreateListing_SuspendedSellerRejected() {
        activeSeller.setStatus(SellerStatus.SUSPENDED);
        when(sellerService.getSellerEntityByUserId(userId)).thenReturn(activeSeller);

        assertThrows(SellerNotActiveException.class, () ->
                listingService.createListing(userId, createRequest));
    }
}
