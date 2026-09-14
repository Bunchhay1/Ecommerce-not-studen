package com.example.catalog.service;

import com.example.catalog.dto.ProductRequest;
import com.example.catalog.dto.ProductResponse;
import com.example.catalog.dto.ProductVariantRequest;
import com.example.catalog.entity.Brand;
import com.example.catalog.entity.Category;
import com.example.catalog.entity.Product;
import com.example.catalog.entity.ProductStatus;
import com.example.catalog.exception.DuplicateResourceException;
import com.example.catalog.exception.ResourceNotFoundException;
import com.example.catalog.kafka.CatalogEventProducer;
import com.example.catalog.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private BrandRepository brandRepository;
    @Mock
    private ProductVariantRepository variantRepository;
    @Mock
    private CatalogEventProducer eventProducer;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product sampleProduct;
    private Brand sampleBrand;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleBrand = Brand.builder()
                .id("brand-1")
                .name("Apple")
                .slug("apple")
                .build();

        sampleCategory = Category.builder()
                .id("cat-1")
                .name("Smartphones")
                .slug("smartphones")
                .build();

        sampleProduct = Product.builder()
                .id("prod-1")
                .name("iPhone 17")
                .slug("iphone-17")
                .description("Latest smartphone")
                .brand(sampleBrand)
                .category(sampleCategory)
                .status(ProductStatus.ACTIVE)
                .build();
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findWithDetailsById("prod-1")).thenReturn(Optional.of(sampleProduct));

        ProductResponse response = productService.getProductById("prod-1");

        assertNotNull(response);
        assertEquals("prod-1", response.getId());
        assertEquals("iPhone 17", response.getName());
        assertEquals(ProductStatus.ACTIVE, response.getStatus());
        assertEquals("Apple", response.getBrand().getName());
        assertEquals("Smartphones", response.getCategory().getName());
    }

    @Test
    void getProductById_NotFound() {
        when(productRepository.findWithDetailsById("invalid")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById("invalid"));
    }

    @Test
    void createProduct_Success() {
        ProductRequest request = ProductRequest.builder()
                .name("iPhone 17 Pro")
                .slug("iphone-17-pro")
                .description("Pro model")
                .brandId("brand-1")
                .categoryId("cat-1")
                .status(ProductStatus.ACTIVE)
                .variants(List.of(
                        ProductVariantRequest.builder()
                                .sku("IPH17P-BLK-256")
                                .status("ACTIVE")
                                .attributes(Map.of("color", "Black", "storage", "256GB"))
                                .build()
                ))
                .build();

        when(productRepository.existsBySlug("iphone-17-pro")).thenReturn(false);
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(sampleBrand));
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(sampleCategory));
        when(variantRepository.existsBySku("IPH17P-BLK-256")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals("iPhone 17 Pro", response.getName());
        assertEquals("iphone-17-pro", response.getSlug());
        verify(eventProducer, times(1)).publishEvent(eq("ProductCreated"), eq("Product"), any(), any());
    }

    @Test
    void createProduct_DuplicateSlug_ThrowsException() {
        ProductRequest request = ProductRequest.builder()
                .name("iPhone 17")
                .slug("iphone-17")
                .build();

        when(productRepository.existsBySlug("iphone-17")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.createProduct(request));
    }

    @Test
    void updateProductStatus_Success() {
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.updateProductStatus("prod-1", ProductStatus.ARCHIVED);

        assertNotNull(response);
        assertEquals(ProductStatus.ARCHIVED, response.getStatus());
        verify(eventProducer, times(1)).publishEvent(eq("ProductStatusChanged"), eq("Product"), eq("prod-1"), any());
    }
}
