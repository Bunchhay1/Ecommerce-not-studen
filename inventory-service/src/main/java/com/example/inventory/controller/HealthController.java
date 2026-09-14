package com.example.inventory.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
@RequestMapping({"/health", "/api/v1/health"})
@Tag(name = "Health", description = "Service Health and Liveness Checks")
public class HealthController {

    @GetMapping
    @Operation(summary = "Get service health status")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "inventory-service",
                "timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString()
        ));
    }

    @GetMapping("/live")
    @Operation(summary = "Liveness probe")
    public ResponseEntity<Map<String, String>> getLiveness() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/ready")
    @Operation(summary = "Readiness probe")
    public ResponseEntity<Map<String, String>> getReadiness() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
