package com.example.marketplace.seller.service;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.*;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerAddress;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.entity.SellerPerformance;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.enums.VerificationStatus;
import com.example.marketplace.exception.SellerAlreadyExistsException;
import com.example.marketplace.exception.SellerNotFoundException;
import com.example.marketplace.outbox.EventPublisherService;
import com.example.marketplace.repository.SellerAddressRepository;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerPerformanceRepository;
import com.example.marketplace.repository.SellerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private static final Logger log = LoggerFactory.getLogger(SellerService.class);

    private final SellerRepository sellerRepository;
    private final SellerAddressRepository addressRepository;
    private final SellerPerformanceRepository performanceRepository;
    private final SellerListingRepository listingRepository;
    private final EventPublisherService eventPublisher;
    private final RedisCacheService cacheService;

    public SellerService(SellerRepository sellerRepository,
                         SellerAddressRepository addressRepository,
                         SellerPerformanceRepository performanceRepository,
                         SellerListingRepository listingRepository,
                         EventPublisherService eventPublisher,
                         RedisCacheService cacheService) {
        this.sellerRepository = sellerRepository;
        this.addressRepository = addressRepository;
        this.performanceRepository = performanceRepository;
        this.listingRepository = listingRepository;
        this.eventPublisher = eventPublisher;
        this.cacheService = cacheService;
    }

    @Transactional
    public SellerResponse registerSeller(String userId, SellerRegisterRequest request) {
        if (sellerRepository.findByUserId(userId).isPresent()) {
            throw new SellerAlreadyExistsException("Seller account already registered for user: " + userId);
        }

        String sellerCode = generateSellerCode();

        Seller seller = new Seller();
        seller.setUserId(userId);
        seller.setSellerCode(sellerCode);
        seller.setDisplayName(request.displayName());
        seller.setLegalName(request.legalName());
        seller.setBusinessName(request.businessName());
        seller.setEmail(request.email());
        seller.setPhone(request.phone());
        if (request.country() != null) {
            seller.setCountry(request.country().toUpperCase());
        }
        seller.setStatus(SellerStatus.PENDING);
        seller.setVerificationStatus(VerificationStatus.PENDING);

        Seller saved = sellerRepository.save(seller);

        // Initialize seller performance record
        SellerPerformance performance = new SellerPerformance();
        performance.setSellerId(saved.getId());
        performanceRepository.save(performance);

        // Outbox event
        eventPublisher.enqueueEvent(
                "Seller",
                saved.getId().toString(),
                "SellerCreated",
                Map.of(
                        "sellerId", saved.getId(),
                        "userId", saved.getUserId(),
                        "sellerCode", saved.getSellerCode(),
                        "status", saved.getStatus().name()
                )
        );

        cacheService.set("seller:" + saved.getId(), SellerResponse.fromEntity(saved), Duration.ofHours(1));
        log.info("Registered new seller {} with code {} for user {}", saved.getId(), saved.getSellerCode(), userId);
        return SellerResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public SellerResponse getCurrentSeller(String userId) {
        return sellerRepository.findByUserId(userId)
                .map(SellerResponse::fromEntity)
                .orElseThrow(() -> new SellerNotFoundException("No seller account found for current user: " + userId));
    }

    @Transactional(readOnly = true)
    public Seller getSellerEntityByUserId(String userId) {
        return sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new SellerNotFoundException("No seller account found for current user: " + userId));
    }

    @Transactional(readOnly = true)
    public SellerResponse getSellerById(UUID sellerId) {
        return cacheService.get("seller:" + sellerId, SellerResponse.class)
                .orElseGet(() -> {
                    Seller seller = sellerRepository.findById(sellerId)
                            .orElseThrow(() -> new SellerNotFoundException(sellerId));
                    SellerResponse response = SellerResponse.fromEntity(seller);
                    cacheService.set("seller:" + sellerId, response, Duration.ofHours(1));
                    return response;
                });
    }

    @Transactional
    public SellerResponse updateSeller(String userId, SellerUpdateRequest request) {
        Seller seller = getSellerEntityByUserId(userId);

        if (request.displayName() != null) seller.setDisplayName(request.displayName());
        if (request.businessName() != null) seller.setBusinessName(request.businessName());
        if (request.phone() != null) seller.setPhone(request.phone());
        if (request.country() != null) seller.setCountry(request.country().toUpperCase());

        Seller saved = sellerRepository.save(seller);

        eventPublisher.enqueueEvent(
                "Seller",
                saved.getId().toString(),
                "SellerUpdated",
                Map.of("sellerId", saved.getId(), "sellerCode", saved.getSellerCode())
        );

        cacheService.delete("seller:" + saved.getId());
        return SellerResponse.fromEntity(saved);
    }

    @Transactional
    public AddressResponse addAddress(String userId, AddressRequest request) {
        Seller seller = getSellerEntityByUserId(userId);

        if (request.isDefault()) {
            addressRepository.findBySellerIdAndIsDefaultTrue(seller.getId())
                    .ifPresent(curr -> {
                        curr.setDefault(false);
                        addressRepository.save(curr);
                    });
        }

        SellerAddress address = new SellerAddress();
        address.setSellerId(seller.getId());
        address.setType(request.type());
        address.setAddressLine1(request.addressLine1());
        address.setAddressLine2(request.addressLine2());
        address.setCity(request.city());
        address.setProvince(request.province());
        if (request.country() != null) {
            address.setCountry(request.country().toUpperCase());
        }
        address.setPostalCode(request.postalCode());
        address.setDefault(request.isDefault());

        SellerAddress saved = addressRepository.save(address);
        return AddressResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(String userId) {
        Seller seller = getSellerEntityByUserId(userId);
        return addressRepository.findBySellerId(seller.getId())
                .stream()
                .map(AddressResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SellerResponse updateSellerStatus(UUID sellerId, SellerStatus newStatus) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new SellerNotFoundException(sellerId));

        seller.setStatus(newStatus);
        if (newStatus == SellerStatus.ACTIVE) {
            seller.setVerificationStatus(VerificationStatus.VERIFIED);
        }

        Seller saved = sellerRepository.save(seller);

        // If suspended or closed, pause all seller listings
        if (newStatus == SellerStatus.SUSPENDED || newStatus == SellerStatus.CLOSED) {
            List<SellerListing> listings = listingRepository.findBySellerId(sellerId);
            for (SellerListing listing : listings) {
                if (listing.getStatus() == ListingStatus.ACTIVE) {
                    listing.setStatus(ListingStatus.PAUSED);
                    listingRepository.save(listing);
                }
            }
            cacheService.deletePattern("product:sellers:*");
        }

        String eventType = "SellerStatusUpdated";
        if (newStatus == SellerStatus.ACTIVE) eventType = "SellerActivated";
        else if (newStatus == SellerStatus.SUSPENDED) eventType = "SellerSuspended";
        else if (newStatus == SellerStatus.VERIFIED) eventType = "SellerVerified";
        else if (newStatus == SellerStatus.CLOSED) eventType = "SellerClosed";

        eventPublisher.enqueueEvent(
                "Seller",
                saved.getId().toString(),
                eventType,
                Map.of("sellerId", saved.getId(), "status", saved.getStatus().name())
        );

        cacheService.delete("seller:" + saved.getId());
        log.info("Updated seller {} status to {}", saved.getId(), newStatus);
        return SellerResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<SellerResponse> getSellersByStatus(SellerStatus status, Pageable pageable) {
        Page<Seller> page = status != null ?
                sellerRepository.findByStatus(status, pageable) :
                sellerRepository.findAll(pageable);
        return page.map(SellerResponse::fromEntity);
    }

    private String generateSellerCode() {
        String candidate;
        do {
            candidate = "SELLER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (sellerRepository.existsBySellerCode(candidate));
        return candidate;
    }
}
