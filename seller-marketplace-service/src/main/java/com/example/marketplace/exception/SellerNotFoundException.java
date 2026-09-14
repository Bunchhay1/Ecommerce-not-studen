package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class SellerNotFoundException extends MarketplaceException {

    public SellerNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "SELLER_NOT_FOUND");
    }

    public SellerNotFoundException(UUID sellerId) {
        super("Seller not found with ID: " + sellerId, HttpStatus.NOT_FOUND, "SELLER_NOT_FOUND");
    }
}
