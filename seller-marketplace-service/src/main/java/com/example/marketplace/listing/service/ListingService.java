package com.example.marketplace.listing.service;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.ListingCreateRequest;
import com.example.marketplace.dto.ListingResponse;
import com.example.marketplace.dto.ListingUpdateRequest;
import com.example.marketplace.entity.Seller;
import com.example.marketplace.entity.SellerListing;
import com.example.marketplace.entity.SellerOffer;
import com.example.marketplace.enums.FulfillmentType;
import com.example.marketplace.enums.ListingStatus;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.exception.ListingNotFoundException;
import com.example.marketplace.exception.MarketplaceException;
import com.example.marketplace.exception.SellerNotActiveException;
import com.example.marketplace.exception.UnauthorizedSellerAccessException;
import com.example.marketplace.outbox.EventPublisherService;
import com.example.marketplace.repository.SellerListingRepository;
import com.example.marketplace.repository.SellerOfferRepository;
import com.example.marketplace.seller.service.SellerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ListingService {

    private static final Logger log = LoggerFactory.getLogger(ListingService.class);

    private final SellerListingRepository listingRepository;
    private final SellerOfferRepository offerRepository;
    private final SellerService sellerService;
    private final EventPublisherService eventPublisher;
    private final RedisCacheService cacheService;

    public ListingService(SellerListingRepository listingRepository,
                          SellerOfferRepository offerRepository,
                          SellerService sellerService,
                          EventPublisherService eventPublisher,
                          RedisCacheService cacheService) {
        this.listingRepository = listingRepository;
        this.offerRepository = offerRepository;
        this.sellerService = sellerService;
        this.eventPublisher = eventPublisher;
        this.cacheService = cacheService;
    }

    @Transactional
    public ListingResponse createListing(String userId, ListingCreateRequest request) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);

        if (seller.getStatus() == SellerStatus.SUSPENDED || seller.getStatus() == SellerStatus.CLOSED) {
            throw new SellerNotActiveException("Seller account is currently " + seller.getStatus() + ". Cannot create new listings.");
        }

        // Duplicate listing check: seller + variant
        if (listingRepository.existsBySellerIdAndVariantId(seller.getId(), request.variantId())) {
            throw new MarketplaceException(
                    "Active listing already exists for seller and variant: " + request.variantId(),
                    HttpStatus.CONFLICT,
                    "LISTING_ALREADY_EXISTS"
            );
        }

        SellerListing listing = new SellerListing();
        listing.setSellerId(seller.getId());
        listing.setProductId(request.productId());
        listing.setVariantId(request.variantId());
        listing.setSellerSku(request.sellerSku());
        listing.setListingTitle(request.listingTitle());
        listing.setCondition(request.condition());
        listing.setPriceReference(request.priceReference());
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setFulfillmentType(request.fulfillmentType() != null ? request.fulfillmentType() : FulfillmentType.SELLER);

        SellerListing saved = listingRepository.save(listing);

        // Also create a linked initial marketplace offer
        SellerOffer offer = new SellerOffer();
        offer.setListingId(saved.getId());
        offer.setSellerId(seller.getId());
        offer.setPrice(request.priceReference());
        offer.setCondition(request.condition());
        offer.setFulfillmentType(listing.getFulfillmentType());
        offer.setStatus("ACTIVE");
        offerRepository.save(offer);

        eventPublisher.enqueueEvent(
                "Listing",
                saved.getId().toString(),
                "ListingCreated",
                Map.of(
                        "listingId", saved.getId(),
                        "sellerId", saved.getSellerId(),
                        "productId", saved.getProductId(),
                        "variantId", saved.getVariantId(),
                        "sellerSku", saved.getSellerSku(),
                        "status", saved.getStatus().name()
                )
        );

        cacheService.delete("product:sellers:" + saved.getProductId());
        log.info("Created listing {} for seller {} and product {}", saved.getId(), seller.getId(), saved.getProductId());
        return ListingResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<ListingResponse> getListingsForSeller(String userId, Pageable pageable) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);
        return listingRepository.findBySellerId(seller.getId(), pageable)
                .map(ListingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ListingResponse getListingById(String userId, UUID listingId) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);
        SellerListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        if (!listing.getSellerId().equals(seller.getId())) {
            throw new UnauthorizedSellerAccessException("Access denied to listing: " + listingId);
        }
        return ListingResponse.fromEntity(listing);
    }

    @Transactional
    public ListingResponse updateListing(String userId, UUID listingId, ListingUpdateRequest request) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);
        SellerListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        if (!listing.getSellerId().equals(seller.getId())) {
            throw new UnauthorizedSellerAccessException("Access denied to listing: " + listingId);
        }

        if (request.listingTitle() != null) listing.setListingTitle(request.listingTitle());
        if (request.condition() != null) listing.setCondition(request.condition());
        if (request.priceReference() != null) listing.setPriceReference(request.priceReference());
        if (request.fulfillmentType() != null) listing.setFulfillmentType(request.fulfillmentType());

        SellerListing saved = listingRepository.save(listing);

        // Update corresponding offer price
        Optional<SellerOffer> offerOpt = offerRepository.findByListingIdAndSellerId(listingId, seller.getId());
        if (offerOpt.isPresent() && request.priceReference() != null) {
            SellerOffer offer = offerOpt.get();
            offer.setPrice(request.priceReference());
            if (request.condition() != null) offer.setCondition(request.condition());
            if (request.fulfillmentType() != null) offer.setFulfillmentType(request.fulfillmentType());
            offerRepository.save(offer);
        }

        eventPublisher.enqueueEvent(
                "Listing",
                saved.getId().toString(),
                "ListingUpdated",
                Map.of("listingId", saved.getId(), "sellerId", saved.getSellerId())
        );

        cacheService.delete("product:sellers:" + saved.getProductId());
        log.info("Updated listing {} for seller {}", saved.getId(), seller.getId());
        return ListingResponse.fromEntity(saved);
    }

    @Transactional
    public ListingResponse activateListing(String userId, UUID listingId) {
        return updateStatus(userId, listingId, ListingStatus.ACTIVE, "ListingActivated");
    }

    @Transactional
    public ListingResponse pauseListing(String userId, UUID listingId) {
        return updateStatus(userId, listingId, ListingStatus.PAUSED, "ListingPaused");
    }

    @Transactional
    public ListingResponse archiveListing(String userId, UUID listingId) {
        return updateStatus(userId, listingId, ListingStatus.ARCHIVED, "ListingArchived");
    }

    @Transactional
    public ListingResponse approveListing(UUID listingId) {
        SellerListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));
        listing.setStatus(ListingStatus.ACTIVE);
        SellerListing saved = listingRepository.save(listing);

        eventPublisher.enqueueEvent(
                "Listing",
                saved.getId().toString(),
                "ListingApproved",
                Map.of("listingId", saved.getId(), "status", saved.getStatus().name())
        );
        cacheService.delete("product:sellers:" + saved.getProductId());
        log.info("Approved listing {}", listingId);
        return ListingResponse.fromEntity(saved);
    }

    @Transactional
    public ListingResponse rejectListing(UUID listingId) {
        SellerListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));
        listing.setStatus(ListingStatus.REJECTED);
        SellerListing saved = listingRepository.save(listing);

        eventPublisher.enqueueEvent(
                "Listing",
                saved.getId().toString(),
                "ListingRejected",
                Map.of("listingId", saved.getId(), "status", saved.getStatus().name())
        );
        cacheService.delete("product:sellers:" + saved.getProductId());
        log.info("Rejected listing {}", listingId);
        return ListingResponse.fromEntity(saved);
    }

    private ListingResponse updateStatus(String userId, UUID listingId, ListingStatus newStatus, String eventType) {
        Seller seller = sellerService.getSellerEntityByUserId(userId);
        SellerListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        if (!listing.getSellerId().equals(seller.getId())) {
            throw new UnauthorizedSellerAccessException("Access denied to listing: " + listingId);
        }

        listing.setStatus(newStatus);
        SellerListing saved = listingRepository.save(listing);

        eventPublisher.enqueueEvent(
                "Listing",
                saved.getId().toString(),
                eventType,
                Map.of("listingId", saved.getId(), "status", newStatus.name())
        );

        cacheService.delete("product:sellers:" + saved.getProductId());
        log.info("Updated listing {} status to {}", saved.getId(), newStatus);
        return ListingResponse.fromEntity(saved);
    }
}
