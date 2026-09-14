package com.example.inventory.controller;

import com.example.inventory.dto.ApiResponse;
import com.example.inventory.dto.ReservationResponse;
import com.example.inventory.dto.ReserveStockRequest;
import com.example.inventory.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventory/reservations")
@Tag(name = "Reservations", description = "Stock Reservation Lifecycle APIs (Reserve, Confirm, Release)")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @Operation(summary = "Reserve stock items for an order before payment")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody ReserveStockRequest request) {
        ReservationResponse response = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock reserved successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation details by ID")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable String id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm stock deduction after successful payment")
    public ResponseEntity<ApiResponse<ReservationResponse>> confirmReservation(@PathVariable String id) {
        ReservationResponse response = reservationService.confirmReservation(id);
        return ResponseEntity.ok(ApiResponse.success("Stock reservation confirmed and deducted", response));
    }

    @PostMapping("/{id}/release")
    @Operation(summary = "Release reserved stock back to available pool on order cancellation or payment failure")
    public ResponseEntity<ApiResponse<ReservationResponse>> releaseReservation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : "Order cancelled or payment failed";
        ReservationResponse response = reservationService.releaseReservation(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Stock reservation released", response));
    }
}
