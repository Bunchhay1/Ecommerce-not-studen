package com.example.marketplace.listing.controller;

import com.example.marketplace.dto.ListingCreateRequest;
import com.example.marketplace.dto.ListingResponse;
import com.example.marketplace.dto.ListingUpdateRequest;
import com.example.marketplace.listing.service.ListingService;
import com.example.marketplace.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sellers/me/listings")
@Tag(name = "Seller Listings", description = "Endpoints for managing seller product offers and listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping
    @Operation(summary = "Create a new product listing / offer")
    public ResponseEntity<ListingResponse> createListing(@Valid @RequestBody ListingCreateRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        ListingResponse response = listingService.createListing(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all listings for current seller (paginated)")
    public ResponseEntity<Page<ListingResponse>> getMyListings(@PageableDefault(size = 20) Pageable pageable) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.getListingsForSeller(userId, pageable));
    }

    @GetMapping("/{listingId}")
    @Operation(summary = "Get a single listing by ID")
    public ResponseEntity<ListingResponse> getListingById(@PathVariable UUID listingId) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.getListingById(userId, listingId));
    }

    @PatchMapping("/{listingId}")
    @Operation(summary = "Update a listing (price reference, condition, fulfillment)")
    public ResponseEntity<ListingResponse> updateListing(@PathVariable UUID listingId,
                                                         @RequestBody ListingUpdateRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.updateListing(userId, listingId, request));
    }

    @PostMapping("/{listingId}/activate")
    @Operation(summary = "Activate a paused listing")
    public ResponseEntity<ListingResponse> activateListing(@PathVariable UUID listingId) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.activateListing(userId, listingId));
    }

    @PostMapping("/{listingId}/pause")
    @Operation(summary = "Pause an active listing")
    public ResponseEntity<ListingResponse> pauseListing(@PathVariable UUID listingId) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.pauseListing(userId, listingId));
    }

    @PostMapping("/{listingId}/archive")
    @Operation(summary = "Archive a listing")
    public ResponseEntity<ListingResponse> archiveListing(@PathVariable UUID listingId) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(listingService.archiveListing(userId, listingId));
    }
}
