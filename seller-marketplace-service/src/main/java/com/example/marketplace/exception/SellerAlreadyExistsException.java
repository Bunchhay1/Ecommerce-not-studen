package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

public class SellerAlreadyExistsException extends MarketplaceException {
    public SellerAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, "SELLER_ALREADY_EXISTS");
    }
}
