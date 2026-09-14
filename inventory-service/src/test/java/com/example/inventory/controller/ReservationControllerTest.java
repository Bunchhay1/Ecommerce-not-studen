package com.example.inventory.controller;

import com.example.inventory.dto.ReservationResponse;
import com.example.inventory.dto.ReserveStockRequest;
import com.example.inventory.enums.ReservationStatus;
import com.example.inventory.security.JwtAuthenticationFilter;
import com.example.inventory.service.ReservationService;
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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ReservationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservationService reservationService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private ReservationResponse sampleReservation;

    @BeforeEach
    void setUp() {
        sampleReservation = new ReservationResponse();
        sampleReservation.setId("res-123");
        sampleReservation.setOrderId("order-456");
        sampleReservation.setIdempotencyKey("idemp-789");
        sampleReservation.setStatus(ReservationStatus.PENDING);
        sampleReservation.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(15));
    }

    @Test
    @WithMockUser
    void testCreateReservation_Success() throws Exception {
        ReserveStockRequest request = new ReserveStockRequest("order-456", "idemp-789", List.of(
                new ReserveStockRequest.ReserveItem("var-1", 2)
        ));

        when(reservationService.createReservation(any(ReserveStockRequest.class))).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/v1/inventory/reservations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderId").value("order-456"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @WithMockUser
    void testConfirmReservation_Success() throws Exception {
        sampleReservation.setStatus(ReservationStatus.CONFIRMED);
        when(reservationService.confirmReservation("res-123")).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/v1/inventory/reservations/res-123/confirm")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    @WithMockUser
    void testReleaseReservation_Success() throws Exception {
        sampleReservation.setStatus(ReservationStatus.RELEASED);
        when(reservationService.releaseReservation(eq("res-123"), any())).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/v1/inventory/reservations/res-123/release")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RELEASED"));
    }
}
