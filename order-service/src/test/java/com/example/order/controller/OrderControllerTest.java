package com.example.order.controller;

import com.example.order.dto.*;
import com.example.order.enums.AddressType;
import com.example.order.enums.OrderStatus;
import com.example.order.enums.PaymentStatus;
import com.example.order.enums.ShippingStatus;
import com.example.order.security.JwtAuthenticationFilter;
import com.example.order.service.CheckoutService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {OrderController.class, HealthController.class})
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CheckoutService checkoutService;

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
        sampleResponse.setStatus(OrderStatus.PENDING_PAYMENT);
        sampleResponse.setSubtotal(new BigDecimal("100.00"));
        sampleResponse.setTotal(new BigDecimal("110.00"));
        sampleResponse.setPaymentStatus(PaymentStatus.PENDING);
        sampleResponse.setShippingStatus(ShippingStatus.NOT_STARTED);
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("order-service"));
    }

    @Test
    void testCheckout_Success() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest();
        OrderAddressDto addr = new OrderAddressDto();
        addr.setType(AddressType.SHIPPING);
        addr.setFullName("John Doe");
        addr.setPhone("+12345678");
        addr.setAddressLine1("Street 1");
        addr.setCity("Phnom Penh");
        addr.setCountry("Cambodia");
        request.setShippingAddress(addr);

        when(checkoutService.checkout(any(), any(CreateOrderRequest.class), any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("ORD-20260913-000123"));
    }

    @Test
    void testGetMyOrders_Success() throws Exception {
        PageResponse<OrderResponse> pageRes = new PageResponse<>();
        pageRes.setItems(List.of(sampleResponse));
        pageRes.setPage(1);
        pageRes.setSize(20);
        pageRes.setTotal(1);

        when(orderService.getUserOrders(any(), any(Pageable.class))).thenReturn(pageRes);

        mockMvc.perform(get("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].id").value("ord-123"));
    }

    @Test
    void testGetOrderById_Success() throws Exception {
        when(orderService.getOrderById(eq("ord-123"), any(), anyBoolean())).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/orders/ord-123")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("ord-123"));
    }

    @Test
    void testCancelOrder_Success() throws Exception {
        sampleResponse.setStatus(OrderStatus.CANCELLED);
        when(orderService.cancelOrder(eq("ord-123"), any(), anyBoolean(), any(), any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/orders/ord-123/cancel")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
