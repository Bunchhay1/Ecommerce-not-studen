package com.example.catalog.controller;

import com.example.catalog.dto.BrandRequest;
import com.example.catalog.dto.BrandResponse;
import com.example.catalog.security.JwtAuthenticationFilter;
import com.example.catalog.service.BrandService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BrandController.class)
@AutoConfigureMockMvc(addFilters = false)
class BrandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BrandService brandService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private BrandResponse sampleBrand;

    @BeforeEach
    void setUp() {
        sampleBrand = BrandResponse.builder()
                .id("brand-1")
                .name("Apple")
                .slug("apple")
                .description("Cupertino tech giant")
                .logoUrl("https://images.example.com/apple.png")
                .websiteUrl("https://apple.com")
                .build();
    }

    @Test
    void getAllBrands_ReturnsList() throws Exception {
        when(brandService.getAllBrands()).thenReturn(List.of(sampleBrand));

        mockMvc.perform(get("/api/v1/brands")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Apple"));
    }

    @Test
    void getBrandById_ReturnsBrand() throws Exception {
        when(brandService.getBrandById("brand-1")).thenReturn(sampleBrand);

        mockMvc.perform(get("/api/v1/brands/brand-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("brand-1"))
                .andExpect(jsonPath("$.data.slug").value("apple"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createBrand_ReturnsCreated() throws Exception {
        BrandRequest request = BrandRequest.builder()
                .name("Apple")
                .slug("apple")
                .description("Cupertino tech giant")
                .build();

        when(brandService.createBrand(any(BrandRequest.class))).thenReturn(sampleBrand);

        mockMvc.perform(post("/api/v1/brands")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Apple"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteBrand_ReturnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/brands/brand-1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(brandService).deleteBrand("brand-1");
    }
}
