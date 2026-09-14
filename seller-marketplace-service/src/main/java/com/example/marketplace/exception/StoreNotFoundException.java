package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class StoreNotFoundException extends MarketplaceException {
    public StoreNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "STORE_NOT_FOUND");
    }

    public StoreNotFoundException(UUID storeId) {
        super("Store not found with ID: " + storeId, HttpStatus.NOT_FOUND, "STORE_NOT_FOUND");
    }
}
