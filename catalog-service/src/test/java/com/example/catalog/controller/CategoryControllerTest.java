package com.example.catalog.controller;

import com.example.catalog.dto.CategoryRequest;
import com.example.catalog.dto.CategoryResponse;
import com.example.catalog.security.JwtAuthenticationFilter;
import com.example.catalog.service.CategoryService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private CategoryResponse sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = CategoryResponse.builder()
                .id("cat-1")
                .name("Electronics")
                .slug("electronics")
                .description("Electronic gadgets")
                .status("ACTIVE")
                .build();
    }

    @Test
    void getAllCategories_ReturnsList() throws Exception {
        when(categoryService.getAllCategories()).thenReturn(List.of(sampleCategory));

        mockMvc.perform(get("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Electronics"));
    }

    @Test
    void getCategoryById_ReturnsCategory() throws Exception {
        when(categoryService.getCategoryById("cat-1")).thenReturn(sampleCategory);

        mockMvc.perform(get("/api/v1/categories/cat-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("cat-1"))
                .andExpect(jsonPath("$.data.slug").value("electronics"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createCategory_ReturnsCreated() throws Exception {
        CategoryRequest request = CategoryRequest.builder()
                .name("Electronics")
                .slug("electronics")
                .description("Electronic gadgets")
                .build();

        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(sampleCategory);

        mockMvc.perform(post("/api/v1/categories")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Electronics"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteCategory_ReturnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/categories/cat-1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(categoryService).deleteCategory("cat-1");
    }
}
