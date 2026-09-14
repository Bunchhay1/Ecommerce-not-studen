package com.example.order.controller;

import com.example.order.dto.OrderResponse;
import com.example.order.dto.PageResponse;
import com.example.order.dto.UpdateOrderStatusRequest;
import com.example.order.enums.OrderStatus;
import com.example.order.enums.PaymentStatus;
import com.example.order.security.JwtAuthenticationFilter;
import com.example.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminOrderController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private OrderResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = new OrderResponse();
        sampleResponse.setId("ord-123");
        sampleResponse.setOrderNumber("ORD-20260913-000123");
        sampleResponse.setUserId("user-1");
        sampleResponse.setStatus(OrderStatus.PROCESSING);
        sampleResponse.setSubtotal(new BigDecimal("100.00"));
        sampleResponse.setTotal(new BigDecimal("110.00"));
        sampleResponse.setPaymentStatus(PaymentStatus.PAID);
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testGetAllOrders_Success() throws Exception {
        PageResponse<OrderResponse> pageRes = new PageResponse<>();
        pageRes.setItems(List.of(sampleResponse));
        pageRes.setPage(1);
        pageRes.setSize(20);
        pageRes.setTotal(1);

        when(orderService.getAllOrders(any(), any(Pageable.class))).thenReturn(pageRes);

        mockMvc.perform(get("/api/v1/admin/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value("ord-123"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testUpdateOrderStatus_Success() throws Exception {
        UpdateOrderStatusRequest updateReq = new UpdateOrderStatusRequest();
        updateReq.setStatus(OrderStatus.SHIPPED);

        sampleResponse.setStatus(OrderStatus.SHIPPED);
        when(orderService.updateOrderStatus(eq("ord-123"), any(UpdateOrderStatusRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/v1/admin/orders/ord-123/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SHIPPED"));
    }
}
