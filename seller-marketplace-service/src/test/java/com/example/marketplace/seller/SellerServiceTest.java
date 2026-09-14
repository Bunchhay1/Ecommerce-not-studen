package com.example.marketplace.seller;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.SellerRegisterRequest;
import com.example.marketplace.dto.SellerResponse;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.exception.SellerAlreadyExistsException;
import com.example.marketplace.exception.SellerNotFoundException;
import com.example.marketplace.outbox.EventPublisherService;
import com.example.marketplace.repository.SellerAddressRepository;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerPerformanceRepository;
import com.example.marketplace.repository.SellerRepository;
import com.example.marketplace.seller.service.SellerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {

    @Mock
    private SellerRepository sellerRepository;
    @Mock
    private SellerAddressRepository addressRepository;
    @Mock
    private SellerPerformanceRepository performanceRepository;
    @Mock
    private SellerListingRepository listingRepository;
    @Mock
    private EventPublisherService eventPublisher;
    @Mock
    private RedisCacheService cacheService;

    @InjectMocks
    private SellerService sellerService;

    private String userId;
    private SellerRegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        userId = "user-12345";
        registerRequest = new SellerRegisterRequest(
                "ABC Tech",
                "ABC Technology LLC",
                "ABC Tech Global",
                "contact@abctech.com",
                "+1234567890",
                "USA"
        );
    }

    @Test
    void testRegisterSeller_Success() {
        when(sellerRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(sellerRepository.existsBySellerCode(any())).thenReturn(false);
        when(sellerRepository.save(any(Seller.class))).thenAnswer(invocation -> {
            Seller s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        SellerResponse response = sellerService.registerSeller(userId, registerRequest);

        assertNotNull(response);
        assertEquals("ABC Tech", response.displayName());
        assertEquals(SellerStatus.PENDING, response.status());
        assertNotNull(response.sellerCode());

        verify(performanceRepository, times(1)).save(any());
        verify(eventPublisher, times(1)).enqueueEvent(eq("Seller"), any(), eq("SellerCreated"), any());
    }

    @Test
    void testRegisterSeller_AlreadyExists() {
        Seller existing = new Seller();
        existing.setUserId(userId);
        when(sellerRepository.findByUserId(userId)).thenReturn(Optional.of(existing));

        assertThrows(SellerAlreadyExistsException.class, () ->
                sellerService.registerSeller(userId, registerRequest));
    }

    @Test
    void testUpdateSellerStatus_SuspendPausesListings() {
        UUID sellerId = UUID.randomUUID();
        Seller seller = new Seller();
        seller.setId(sellerId);
        seller.setStatus(SellerStatus.ACTIVE);

        when(sellerRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(sellerRepository.save(any())).thenReturn(seller);

        SellerListing listing = new SellerListing();
        listing.setSellerId(sellerId);
        listing.setStatus(ListingStatus.ACTIVE);
        when(listingRepository.findBySellerId(sellerId)).thenReturn(List.of(listing));

        SellerResponse response = sellerService.updateSellerStatus(sellerId, SellerStatus.SUSPENDED);

        assertEquals(SellerStatus.SUSPENDED, response.status());
        assertEquals(ListingStatus.PAUSED, listing.getStatus());
        verify(listingRepository, times(1)).save(listing);
        verify(eventPublisher, times(1)).enqueueEvent(eq("Seller"), any(), eq("SellerSuspended"), any());
    }
}
