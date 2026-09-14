package com.example.catalog.controller;

import com.example.catalog.dto.*;
import com.example.catalog.entity.ProductStatus;
import com.example.catalog.security.JwtAuthenticationFilter;
import com.example.catalog.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private ProductResponse sampleProductResponse;

    @BeforeEach
    void setUp() {
        sampleProductResponse = ProductResponse.builder()
                .id("prod-123")
                .name("MacBook Pro M3")
                .slug("macbook-pro-m3")
                .description("High-performance laptop")
                .status(ProductStatus.ACTIVE)
                .brand(BrandResponse.builder().id("brand-1").name("Apple").slug("apple").build())
                .category(CategoryResponse.builder().id("cat-1").name("Laptops").slug("laptops").build())
                .build();
    }

    @Test
    void getProducts_ReturnsPagedResult() throws Exception {
        when(productService.getProducts(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleProductResponse)));

        mockMvc.perform(get("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("MacBook Pro M3"));
    }

    @Test
    void getProductById_ReturnsProduct() throws Exception {
        when(productService.getProductById("prod-123")).thenReturn(sampleProductResponse);

        mockMvc.perform(get("/api/v1/products/prod-123")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("prod-123"))
                .andExpect(jsonPath("$.data.name").value("MacBook Pro M3"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createProduct_ReturnsCreatedProduct() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("MacBook Pro M3")
                .slug("macbook-pro-m3")
                .description("High-performance laptop")
                .brandId("brand-1")
                .categoryId("cat-1")
                .status(ProductStatus.ACTIVE)
                .build();

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(sampleProductResponse);

        mockMvc.perform(post("/api/v1/products")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("MacBook Pro M3"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void updateProductStatus_ReturnsUpdatedProduct() throws Exception {
        ProductStatusUpdateRequest request = ProductStatusUpdateRequest.builder()
                .status(ProductStatus.ARCHIVED)
                .build();

        ProductResponse updatedResponse = ProductResponse.builder()
                .id("prod-123")
                .name("MacBook Pro M3")
                .slug("macbook-pro-m3")
                .status(ProductStatus.ARCHIVED)
                .build();

        when(productService.updateProductStatus(eq("prod-123"), eq(ProductStatus.ARCHIVED)))
                .thenReturn(updatedResponse);

        mockMvc.perform(patch("/api/v1/products/prod-123/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ARCHIVED"));
    }

    @Test
    void getProductVariants_ReturnsVariants() throws Exception {
        ProductVariantResponse variantResponse = ProductVariantResponse.builder()
                .id("var-1")
                .sku("MBP-M3-16GB")
                .status("ACTIVE")
                .attributes(Map.of("ram", "16GB"))
                .build();

        when(productService.getProductVariants("prod-123")).thenReturn(List.of(variantResponse));

        mockMvc.perform(get("/api/v1/products/prod-123/variants")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].sku").value("MBP-M3-16GB"));
    }
}
