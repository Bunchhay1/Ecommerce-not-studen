package com.example.inventory.controller;

import com.example.inventory.dto.*;
import com.example.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Stock Management and Real-time Availability APIs")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/items")
    @Operation(summary = "Create a new inventory tracking item")
    public ResponseEntity<ApiResponse<InventoryResponse>> createItem(@Valid @RequestBody CreateInventoryItemRequest request) {
        InventoryResponse response = inventoryService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inventory item created successfully", response));
    }

    @GetMapping("/{variantId}")
    @Operation(summary = "Get stock availability for a specific variant")
    public ResponseEntity<ApiResponse<InventoryResponse>> getByVariantId(@PathVariable String variantId) {
        InventoryResponse response = inventoryService.getByVariantId(variantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get stock availability by SKU")
    public ResponseEntity<ApiResponse<InventoryResponse>> getBySku(@PathVariable String sku) {
        InventoryResponse response = inventoryService.getBySku(sku);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get stock for all variants of a product")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getByProductId(@PathVariable String productId) {
        List<InventoryResponse> response = inventoryService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/check")
    @Operation(summary = "Check real-time stock availability for multiple items (e.g. at checkout)")
    public ResponseEntity<ApiResponse<CheckStockResponse>> checkStock(@Valid @RequestBody CheckStockRequest request) {
        CheckStockResponse response = inventoryService.checkStock(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{variantId}/stock")
    @Operation(summary = "Add/Restock inventory for a variant")
    public ResponseEntity<ApiResponse<InventoryResponse>> addStock(
            @PathVariable String variantId,
            @Valid @RequestBody AddStockRequest request) {
        InventoryResponse response = inventoryService.addStock(variantId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock added successfully", response));
    }

    @PatchMapping("/{variantId}")
    @Operation(summary = "Adjust inventory details or manual stock level")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @PathVariable String variantId,
            @RequestBody AdjustStockRequest request) {
        InventoryResponse response = inventoryService.adjustStock(variantId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", response));
    }
}
