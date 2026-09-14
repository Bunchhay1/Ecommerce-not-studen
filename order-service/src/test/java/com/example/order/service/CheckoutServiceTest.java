package com.example.order.service;

import com.example.order.client.CartClient;
import com.example.order.client.InventoryClient;
import com.example.order.client.dto.CartClientDto;
import com.example.order.client.dto.InventoryClientDto;
import com.example.order.dto.CreateOrderRequest;
import com.example.order.dto.OrderAddressDto;
import com.example.order.dto.OrderResponse;
import com.example.order.entity.Order;
import com.example.order.enums.AddressType;
import com.example.order.enums.OrderStatus;
import com.example.order.exception.CartEmptyException;
import com.example.order.exception.InventoryReservationFailedException;
import com.example.order.repository.OrderRepository;
import com.example.order.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CheckoutServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OutboxEventRepository outboxRepository;

    @Mock
    private CartClient cartClient;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private OrderCacheService cacheService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CheckoutService checkoutService;

    private CreateOrderRequest validRequest;
    private OrderAddressDto addressDto;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        addressDto = new OrderAddressDto();
        addressDto.setType(AddressType.SHIPPING);
        addressDto.setFullName("John Doe");
        addressDto.setPhone("+123456789");
        addressDto.setAddressLine1("123 Main Street");
        addressDto.setCity("Phnom Penh");
        addressDto.setCountry("Cambodia");

        validRequest = new CreateOrderRequest();
        validRequest.setPaymentMethod("CARD");
        validRequest.setShippingAddress(addressDto);
        validRequest.setIdempotencyKey("idemp-ord-001");
    }

    @Test
    void testCheckout_Success_FromCart() {
        CartClientDto cart = new CartClientDto();
        cart.setId("cart-1");
        cart.setUserId("user-1");

        CartClientDto.CartItemClientDto cItem = new CartClientDto.CartItemClientDto();
        cItem.setProductId("prod-1");
        cItem.setVariantId("var-1");
        cItem.setSku("SKU-1");
        cItem.setProductName("iPhone 17 Pro Max");
        cItem.setQuantity(2);
        cItem.setUnitPrice(new BigDecimal("750.00"));
        cItem.setSubtotal(new BigDecimal("1500.00"));
        cart.setItems(List.of(cItem));

        when(orderRepository.findByIdempotencyKey("idemp-ord-001")).thenReturn(Optional.empty());
        when(cartClient.getActiveCart(any())).thenReturn(cart);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("ord-uuid-1");
            return o;
        });

        InventoryClientDto.ReservationResponseDto resDto = new InventoryClientDto.ReservationResponseDto();
        resDto.setId("res-123");
        resDto.setOrderId("ord-uuid-1");
        resDto.setStatus("PENDING");
        when(inventoryClient.reserveStock(any(), any())).thenReturn(resDto);

        OrderResponse response = checkoutService.checkout("user-1", validRequest, "mock-jwt-token");

        assertNotNull(response);
        assertEquals("user-1", response.getUserId());
        assertEquals(OrderStatus.PENDING_PAYMENT, response.getStatus());
        assertEquals("res-123", response.getReservationId());
        assertEquals(1, response.getItems().size());
        assertEquals("iPhone 17 Pro Max", response.getItems().get(0).getProductName());

        // subtotal = 1500, shipping = 0 (> 100), tax = 150 (10%), total = 1650.00
        assertEquals(new BigDecimal("1500.00"), response.getSubtotal());
        assertEquals(new BigDecimal("1650.00"), response.getTotal());

        verify(cartClient).clearCart("mock-jwt-token");
        verify(outboxRepository).save(any());
        verify(cacheService).put(eq(response.getId()), any());
    }

    @Test
    void testCheckout_Success_DirectItems() {
        validRequest.setDirectItems(List.of(
                new CreateOrderRequest.DirectOrderItem("prod-2", "var-2", "SKU-2", "AirPods Pro", null, 1, new BigDecimal("200.00"))
        ));

        when(orderRepository.findByIdempotencyKey("idemp-ord-001")).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("ord-uuid-2");
            return o;
        });

        InventoryClientDto.ReservationResponseDto resDto = new InventoryClientDto.ReservationResponseDto();
        resDto.setId("res-456");
        when(inventoryClient.reserveStock(any(), any())).thenReturn(resDto);

        OrderResponse response = checkoutService.checkout("user-1", validRequest, "mock-token");

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("200.00"), response.getSubtotal());
        // subtotal = 200, shipping = 0, tax = 20.00, total = 220.00
        assertEquals(new BigDecimal("220.00"), response.getTotal());

        verify(cartClient, never()).getActiveCart(any());
    }

    @Test
    void testCheckout_EmptyCart_ThrowsException() {
        when(orderRepository.findByIdempotencyKey("idemp-ord-001")).thenReturn(Optional.empty());
        when(cartClient.getActiveCart(any())).thenReturn(null);

        assertThrows(CartEmptyException.class, () -> checkoutService.checkout("user-1", validRequest, "token"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void testCheckout_InventoryReservationFailed_ThrowsException() {
        CartClientDto cart = new CartClientDto();
        CartClientDto.CartItemClientDto cItem = new CartClientDto.CartItemClientDto();
        cItem.setProductId("prod-1");
        cItem.setVariantId("var-1");
        cItem.setSku("SKU-1");
        cItem.setProductName("iPhone");
        cItem.setQuantity(1);
        cItem.setUnitPrice(new BigDecimal("500.00"));
        cItem.setSubtotal(new BigDecimal("500.00"));
        cart.setItems(List.of(cItem));

        when(orderRepository.findByIdempotencyKey("idemp-ord-001")).thenReturn(Optional.empty());
        when(cartClient.getActiveCart(any())).thenReturn(cart);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryClient.reserveStock(any(), any())).thenReturn(null); // failure

        assertThrows(InventoryReservationFailedException.class, () -> checkoutService.checkout("user-1", validRequest, "token"));

        verify(outboxRepository, never()).save(any());
    }

    @Test
    void testCheckout_IdempotencyReplay() {
        Order existing = new Order("ORD-EXISTING-1", "user-1", "USD", "CARD", "idemp-ord-001");
        existing.setId("ord-existing-id");

        when(orderRepository.findByIdempotencyKey("idemp-ord-001")).thenReturn(Optional.of(existing));

        OrderResponse response = checkoutService.checkout("user-1", validRequest, "token");

        assertNotNull(response);
        assertEquals("ord-existing-id", response.getId());
        verify(inventoryClient, never()).reserveStock(any(), any());
    }
}
