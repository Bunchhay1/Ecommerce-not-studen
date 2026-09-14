package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedSellerAccessException extends MarketplaceException {
    public UnauthorizedSellerAccessException(String message) {
        super(message, HttpStatus.FORBIDDEN, "UNAUTHORIZED_SELLER_ACCESS");
    }
}
