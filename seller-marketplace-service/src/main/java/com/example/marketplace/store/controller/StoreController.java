package com.example.marketplace.store.controller;

import com.example.marketplace.dto.StoreRequest;
import com.example.marketplace.dto.StoreResponse;
import com.example.marketplace.security.SecurityUtils;
import com.example.marketplace.store.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Seller Stores", description = "Endpoints for seller storefronts and public store pages")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @PostMapping("/api/v1/sellers/me/store")
    @Operation(summary = "Create or update store configuration for current seller")
    public ResponseEntity<StoreResponse> createOrUpdateStore(@Valid @RequestBody StoreRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(storeService.createOrUpdateStore(userId, request));
    }

    @GetMapping("/api/v1/sellers/me/store")
    @Operation(summary = "Get store configuration for current seller")
    public ResponseEntity<StoreResponse> getMyStore() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(storeService.getStoreByUserId(userId));
    }

    @GetMapping("/api/v1/stores/{slug}")
    @Operation(summary = "Get public store details by slug")
    public ResponseEntity<StoreResponse> getStoreBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(storeService.getStoreBySlug(slug));
    }
}
