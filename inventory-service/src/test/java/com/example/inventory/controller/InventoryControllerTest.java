package com.example.inventory.controller;

import com.example.inventory.dto.*;
import com.example.inventory.enums.InventoryStatus;
import com.example.inventory.security.JwtAuthenticationFilter;
import com.example.inventory.service.InventoryService;
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
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {InventoryController.class, HealthController.class})
@AutoConfigureMockMvc(addFilters = false)
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private InventoryResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = new InventoryResponse();
        sampleResponse.setId("inv-123");
        sampleResponse.setProductId("prod-1");
        sampleResponse.setVariantId("var-1");
        sampleResponse.setSku("SKU-1");
        sampleResponse.setTotalQuantity(100);
        sampleResponse.setReservedQuantity(10);
        sampleResponse.setAvailableQuantity(90);
        sampleResponse.setStatus(InventoryStatus.IN_STOCK);
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("inventory-service"));
    }

    @Test
    void testGetByVariantId_Success() throws Exception {
        when(inventoryService.getByVariantId("var-1")).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/inventory/var-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.variantId").value("var-1"))
                .andExpect(jsonPath("$.data.availableQuantity").value(90));
    }

    @Test
    void testCheckStock_Success() throws Exception {
        CheckStockRequest request = new CheckStockRequest(List.of(
                new CheckStockRequest.CheckItem("var-1", 5)
        ));

        CheckStockResponse checkResponse = new CheckStockResponse(true, List.of(
                new CheckStockResponse.CheckStockItemResult("var-1", 5, 90, true)
        ));

        when(inventoryService.checkStock(any(CheckStockRequest.class))).thenReturn(checkResponse);

        mockMvc.perform(post("/api/v1/inventory/check")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.items[0].inStock").value(true));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testAddStock_Success() throws Exception {
        AddStockRequest request = new AddStockRequest(50, "Restock");
        sampleResponse.setTotalQuantity(150);
        sampleResponse.setAvailableQuantity(140);

        when(inventoryService.addStock(eq("var-1"), any(AddStockRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/inventory/var-1/stock")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalQuantity").value(150));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreateItem_Success() throws Exception {
        CreateInventoryItemRequest request = new CreateInventoryItemRequest("prod-1", "var-1", "SKU-1", 100, 10);

        when(inventoryService.createItem(any(CreateInventoryItemRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/inventory/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("SKU-1"));
    }
}
