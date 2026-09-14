package com.example.marketplace.controller;

import com.example.marketplace.dto.SellerRegisterRequest;
import com.example.marketplace.dto.SellerResponse;
import com.example.marketplace.enums.SellerStatus;
import com.example.marketplace.enums.VerificationStatus;
import com.example.marketplace.performance.service.PerformanceService;
import com.example.marketplace.security.JwtAuthenticationFilter;
import com.example.marketplace.seller.controller.SellerController;
import com.example.marketplace.seller.service.SellerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SellerController.class)
@AutoConfigureMockMvc(addFilters = false)
class SellerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SellerService sellerService;

    @MockBean
    private PerformanceService performanceService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @WithMockUser(username = "user-123")
    void testRegisterSeller_Endpoint() throws Exception {
        SellerRegisterRequest request = new SellerRegisterRequest(
                "ABC Store",
                "ABC Store Inc",
                "ABC Store Global",
                "seller@abc.com",
                "+123456789",
                "USA"
        );

        UUID sellerId = UUID.randomUUID();
        SellerResponse response = new SellerResponse(
                sellerId,
                "user-123",
                "SELLER-ABC1",
                "ABC Store",
                "ABC Store Inc",
                "ABC Store Global",
                "seller@abc.com",
                "+123456789",
                "USA",
                SellerStatus.PENDING,
                VerificationStatus.PENDING,
                OffsetDateTime.now(ZoneOffset.UTC),
                OffsetDateTime.now(ZoneOffset.UTC)
        );

        when(sellerService.registerSeller(eq("user-123"), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/sellers")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sellerCode").value("SELLER-ABC1"))
                .andExpect(jsonPath("$.displayName").value("ABC Store"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "user-123")
    void testGetMySellerProfile_Endpoint() throws Exception {
        UUID sellerId = UUID.randomUUID();
        SellerResponse response = new SellerResponse(
                sellerId,
                "user-123",
                "SELLER-ABC1",
                "ABC Store",
                "ABC Store Inc",
                "ABC Store Global",
                "seller@abc.com",
                "+123456789",
                "USA",
                SellerStatus.ACTIVE,
                VerificationStatus.VERIFIED,
                OffsetDateTime.now(ZoneOffset.UTC),
                OffsetDateTime.now(ZoneOffset.UTC)
        );

        when(sellerService.getCurrentSeller("user-123")).thenReturn(response);

        mockMvc.perform(get("/api/v1/sellers/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerCode").value("SELLER-ABC1"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
