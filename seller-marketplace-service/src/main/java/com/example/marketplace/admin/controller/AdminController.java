package com.example.marketplace.admin.controller;

import com.example.marketplace.commission.service.CommissionService;
import com.example.marketplace.dto.*;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.listing.service.ListingService;
import com.example.marketplace.seller.service.SellerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Marketplace Administration", description = "Admin endpoints for seller verification, suspensions, approvals, and commission rules")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final SellerService sellerService;
    private final ListingService listingService;
    private final CommissionService commissionService;

    public AdminController(SellerService sellerService,
                           ListingService listingService,
                           CommissionService commissionService) {
        this.sellerService = sellerService;
        this.listingService = listingService;
        this.commissionService = commissionService;
    }

    @GetMapping("/sellers")
    @Operation(summary = "Get list of all sellers with optional status filter")
    public ResponseEntity<Page<SellerResponse>> getSellers(
            @RequestParam(required = false) SellerStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(sellerService.getSellersByStatus(status, pageable));
    }

    @GetMapping("/sellers/{sellerId}")
    @Operation(summary = "Get seller details by ID")
    public ResponseEntity<SellerResponse> getSellerById(@PathVariable UUID sellerId) {
        return ResponseEntity.ok(sellerService.getSellerById(sellerId));
    }

    @PostMapping("/sellers/{sellerId}/verify")
    @Operation(summary = "Approve and activate seller account")
    public ResponseEntity<SellerResponse> verifySeller(@PathVariable UUID sellerId) {
        return ResponseEntity.ok(sellerService.updateSellerStatus(sellerId, SellerStatus.ACTIVE));
    }

    @PostMapping("/sellers/{sellerId}/suspend")
    @Operation(summary = "Suspend seller account and pause their listings")
    public ResponseEntity<SellerResponse> suspendSeller(@PathVariable UUID sellerId) {
        return ResponseEntity.ok(sellerService.updateSellerStatus(sellerId, SellerStatus.SUSPENDED));
    }

    @PostMapping("/listings/{listingId}/approve")
    @Operation(summary = "Approve pending listing")
    public ResponseEntity<ListingResponse> approveListing(@PathVariable UUID listingId) {
        return ResponseEntity.ok(listingService.approveListing(listingId));
    }

    @PostMapping("/listings/{listingId}/reject")
    @Operation(summary = "Reject listing")
    public ResponseEntity<ListingResponse> rejectListing(@PathVariable UUID listingId) {
        return ResponseEntity.ok(listingService.rejectListing(listingId));
    }

    @PostMapping("/commissions")
    @Operation(summary = "Create marketplace commission rule")
    public ResponseEntity<CommissionRuleResponse> createCommissionRule(@Valid @RequestBody CommissionRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commissionService.createRule(request));
    }

    @GetMapping("/commissions")
    @Operation(summary = "List all active commission rules")
    public ResponseEntity<List<CommissionRuleResponse>> getCommissionRules() {
        return ResponseEntity.ok(commissionService.getAllActiveRules());
    }

    @GetMapping("/commissions/calculate")
    @Operation(summary = "Test commission fee calculation")
    public ResponseEntity<CommissionCalculationResponse> calculateCommission(
            @RequestParam UUID sellerId,
            @RequestParam(required = false) String categoryId,
            @RequestParam BigDecimal grossAmount) {
        return ResponseEntity.ok(commissionService.calculateCommission(sellerId, categoryId, grossAmount));
    }
}
