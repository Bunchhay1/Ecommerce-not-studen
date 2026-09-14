package com.example.order.client;

import com.example.order.client.dto.CartClientDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CartClient {

    private static final Logger log = LoggerFactory.getLogger(CartClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String cartServiceUrl;

    public CartClient(RestClient restClient,
                      ObjectMapper objectMapper,
                      @Value("${app.services.cart-url:http://localhost:8085}") String cartServiceUrl) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.cartServiceUrl = cartServiceUrl;
    }

    public CartClientDto getActiveCart(String token) {
        try {
            log.info("Fetching active cart from Cart Service at: {}/api/v1/cart", cartServiceUrl);
            String responseBody = restClient.get()
                    .uri(cartServiceUrl + "/api/v1/cart")
                    .header("Authorization", token != null && token.startsWith("Bearer ") ? token : "Bearer " + token)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null) return null;

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataNode = root.has("data") ? root.get("data") : root;
            if (dataNode == null || dataNode.isNull()) return null;

            return objectMapper.treeToValue(dataNode, CartClientDto.class);
        } catch (Exception e) {
            log.warn("Failed to fetch active cart: {}", e.getMessage());
            return null;
        }
    }

    public void clearCart(String token) {
        try {
            log.info("Clearing active cart in Cart Service at: {}/api/v1/cart", cartServiceUrl);
            restClient.delete()
                    .uri(cartServiceUrl + "/api/v1/cart")
                    .header("Authorization", token != null && token.startsWith("Bearer ") ? token : "Bearer " + token)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to clear cart: {}", e.getMessage());
        }
    }
}
