package com.example.catalog.service;

import com.example.catalog.dto.*;
import com.example.catalog.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    Page<ProductResponse> getProducts(ProductStatus status, String categoryId, String brandId, Pageable pageable);
    ProductResponse getProductById(String id);
    ProductResponse getProductBySlug(String slug);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(String id, ProductRequest request);
    ProductResponse updateProductStatus(String id, ProductStatus status);
    void deleteProduct(String id);

    // Variants
    List<ProductVariantResponse> getProductVariants(String productId);
    ProductVariantResponse addProductVariant(String productId, ProductVariantRequest request);
    ProductVariantResponse updateVariant(String variantId, ProductVariantRequest request);
    void deleteVariant(String variantId);
}
