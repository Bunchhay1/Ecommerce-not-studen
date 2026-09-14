package com.example.order.dto;

public class CancelOrderRequest {

    private String reason = "Customer cancelled order";

    public CancelOrderRequest() {
    }

    public CancelOrderRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
