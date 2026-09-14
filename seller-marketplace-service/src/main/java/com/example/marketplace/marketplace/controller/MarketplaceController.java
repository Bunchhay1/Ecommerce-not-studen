package com.example.marketplace.marketplace.controller;

import com.example.marketplace.dto.ProductSellerListingResponse;
import com.example.marketplace.marketplace.service.MarketplaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Marketplace Public", description = "Public endpoints for marketplace product seller listings and comparisons")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/{productId}/sellers")
    @Operation(summary = "Get all active sellers and offers for a catalog product")
    public ResponseEntity<ProductSellerListingResponse> getSellersForProduct(@PathVariable String productId) {
        return ResponseEntity.ok(marketplaceService.getSellersForProduct(productId));
    }
}
