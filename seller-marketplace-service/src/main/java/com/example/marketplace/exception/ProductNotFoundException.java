package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

public class ProductNotFoundException extends MarketplaceException {
    public ProductNotFoundException(String productId) {
        super("Product not found in marketplace catalog reference: " + productId, HttpStatus.BAD_REQUEST, "PRODUCT_NOT_FOUND");
    }
}
