package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

public class SellerNotActiveException extends MarketplaceException {
    public SellerNotActiveException(String message) {
        super(message, HttpStatus.FORBIDDEN, "SELLER_NOT_ACTIVE");
    }
}
