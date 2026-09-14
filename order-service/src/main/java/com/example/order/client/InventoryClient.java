package com.example.order.client;

import com.example.order.client.dto.InventoryClientDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class InventoryClient {

    private static final Logger log = LoggerFactory.getLogger(InventoryClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String inventoryServiceUrl;

    public InventoryClient(RestClient restClient,
                           ObjectMapper objectMapper,
                           @Value("${app.services.inventory-url:http://localhost:8086}") String inventoryServiceUrl) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.inventoryServiceUrl = inventoryServiceUrl;
    }

    public InventoryClientDto.ReservationResponseDto reserveStock(InventoryClientDto.ReserveStockRequestDto request, String token) {
        try {
            log.info("Requesting stock reservation from Inventory Service at: {}/api/v1/inventory/reservations", inventoryServiceUrl);
            var reqSpec = restClient.post()
                    .uri(inventoryServiceUrl + "/api/v1/inventory/reservations")
                    .contentType(MediaType.APPLICATION_JSON);

            if (token != null && !token.isBlank()) {
                reqSpec.header("Authorization", token.startsWith("Bearer ") ? token : "Bearer " + token);
            }

            String responseBody = reqSpec.body(request)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null) return null;

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataNode = root.has("data") ? root.get("data") : root;
            if (dataNode == null || dataNode.isNull()) return null;

            return objectMapper.treeToValue(dataNode, InventoryClientDto.ReservationResponseDto.class);
        } catch (Exception e) {
            log.error("Failed to reserve stock in Inventory Service: {}", e.getMessage());
            return null;
        }
    }

    public void confirmReservation(String reservationId, String token) {
        try {
            log.info("Confirming reservation '{}' at: {}/api/v1/inventory/reservations/{}/confirm", reservationId, inventoryServiceUrl, reservationId);
            var reqSpec = restClient.post()
                    .uri(inventoryServiceUrl + "/api/v1/inventory/reservations/" + reservationId + "/confirm");

            if (token != null && !token.isBlank()) {
                reqSpec.header("Authorization", token.startsWith("Bearer ") ? token : "Bearer " + token);
            }

            reqSpec.retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to confirm reservation '{}': {}", reservationId, e.getMessage());
        }
    }

    public void releaseReservation(String reservationId, String reason, String token) {
        try {
            log.info("Releasing reservation '{}' at: {}/api/v1/inventory/reservations/{}/release", reservationId, inventoryServiceUrl, reservationId);
            var reqSpec = restClient.post()
                    .uri(inventoryServiceUrl + "/api/v1/inventory/reservations/" + reservationId + "/release")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("reason", reason != null ? reason : "Order cancelled"));

            if (token != null && !token.isBlank()) {
                reqSpec.header("Authorization", token.startsWith("Bearer ") ? token : "Bearer " + token);
            }

            reqSpec.retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to release reservation '{}': {}", reservationId, e.getMessage());
        }
    }
}
