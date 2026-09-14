package com.example.marketplace.seller.controller;

import com.example.marketplace.dto.*;
import com.example.marketplace.performance.service.PerformanceService;
import com.example.marketplace.security.SecurityUtils;
import com.example.marketplace.seller.service.SellerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sellers")
@Tag(name = "Seller Management", description = "Endpoints for seller onboarding, profiles, and addresses")
public class SellerController {

    private final SellerService sellerService;
    private final PerformanceService performanceService;

    public SellerController(SellerService sellerService, PerformanceService performanceService) {
        this.sellerService = sellerService;
        this.performanceService = performanceService;
    }

    @PostMapping
    @Operation(summary = "Register as a marketplace seller")
    public ResponseEntity<SellerResponse> registerSeller(@Valid @RequestBody SellerRegisterRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        SellerResponse response = sellerService.registerSeller(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated seller profile")
    public ResponseEntity<SellerResponse> getCurrentSeller() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(sellerService.getCurrentSeller(userId));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current seller profile details")
    public ResponseEntity<SellerResponse> updateCurrentSeller(@RequestBody SellerUpdateRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(sellerService.updateSeller(userId, request));
    }

    @PostMapping("/me/addresses")
    @Operation(summary = "Add warehouse or business address for current seller")
    public ResponseEntity<AddressResponse> addAddress(@Valid @RequestBody AddressRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        AddressResponse response = sellerService.addAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me/addresses")
    @Operation(summary = "List all addresses for current seller")
    public ResponseEntity<List<AddressResponse>> getAddresses() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(sellerService.getAddresses(userId));
    }

    @GetMapping("/me/performance")
    @Operation(summary = "Get performance metrics and rating for current seller")
    public ResponseEntity<SellerPerformanceResponse> getPerformance() {
        String userId = SecurityUtils.getCurrentUserId();
        SellerResponse seller = sellerService.getCurrentSeller(userId);
        return ResponseEntity.ok(performanceService.getPerformance(seller.id()));
    }
}
