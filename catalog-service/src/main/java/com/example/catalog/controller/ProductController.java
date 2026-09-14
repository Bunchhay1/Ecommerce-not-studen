package com.example.catalog.controller;

import com.example.catalog.dto.*;
import com.example.catalog.entity.ProductStatus;
import com.example.catalog.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Products", description = "Product and Variant catalog management APIs")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    @Operation(summary = "Browse products with pagination and filters")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String brandId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        Page<ProductResponse> products = productService.getProducts(status, categoryId, brandId, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Get product details by ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @GetMapping("/products/slug/{slug}")
    @Operation(summary = "Get product details by Slug")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductBySlug(slug)));
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Create a new product (Admin/Seller only)")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", response));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Update product (Admin/Seller only)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
    }

    @PatchMapping("/products/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Update product status (Admin/Seller only)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @PathVariable String id,
            @Valid @RequestBody ProductStatusUpdateRequest request) {
        ProductResponse response = productService.updateProductStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Product status updated successfully", response));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Delete product (Admin/Seller only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    // Product Variants APIs
    @GetMapping("/products/{productId}/variants")
    @Operation(summary = "Get variants for a product")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getProductVariants(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductVariants(productId)));
    }

    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Add a variant to a product (Admin/Seller only)")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> addProductVariant(
            @PathVariable String productId,
            @Valid @RequestBody ProductVariantRequest request) {
        ProductVariantResponse response = productService.addProductVariant(productId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product variant added successfully", response));
    }

    @PutMapping("/variants/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Update a variant (Admin/Seller only)")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateVariant(
            @PathVariable String variantId,
            @Valid @RequestBody ProductVariantRequest request) {
        ProductVariantResponse response = productService.updateVariant(variantId, request);
        return ResponseEntity.ok(ApiResponse.success("Product variant updated successfully", response));
    }

    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Delete a variant (Admin/Seller only)")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable String variantId) {
        productService.deleteVariant(variantId);
        return ResponseEntity.ok(ApiResponse.success("Product variant deleted successfully", null));
    }
}
