package com.example.inventory.controller;

import com.example.inventory.dto.ApiResponse;
import com.example.inventory.dto.WarehouseDto;
import com.example.inventory.entity.WarehouseStock;
import com.example.inventory.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/warehouses")
@Tag(name = "Warehouses", description = "Fulfillment Centers & Multi-Location Stock APIs")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @PostMapping
    @Operation(summary = "Register a new warehouse facility")
    public ResponseEntity<ApiResponse<WarehouseDto>> createWarehouse(@Valid @RequestBody WarehouseDto dto) {
        WarehouseDto response = warehouseService.createWarehouse(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Warehouse created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all registered warehouses")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> getAllWarehouses() {
        List<WarehouseDto> response = warehouseService.getAllWarehouses();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse details by ID")
    public ResponseEntity<ApiResponse<WarehouseDto>> getWarehouseById(@PathVariable String id) {
        WarehouseDto response = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/stock")
    @Operation(summary = "Get stock list for a specific warehouse")
    public ResponseEntity<ApiResponse<List<WarehouseStock>>> getStockInWarehouse(@PathVariable String id) {
        List<WarehouseStock> stock = warehouseService.getStockInWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success(stock));
    }

    @PostMapping("/{id}/stock")
    @Operation(summary = "Set variant stock in a specific warehouse")
    public ResponseEntity<ApiResponse<WarehouseStock>> setStockInWarehouse(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String variantId = (String) body.get("variantId");
        Number quantity = (Number) body.get("quantity");
        if (variantId == null || quantity == null) {
            throw new IllegalArgumentException("variantId and quantity are required");
        }
        WarehouseStock stock = warehouseService.setStockInWarehouse(id, variantId, quantity.intValue());
        return ResponseEntity.ok(ApiResponse.success("Warehouse stock updated", stock));
    }
}
