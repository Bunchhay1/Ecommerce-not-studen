package com.example.marketplace.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class ListingNotFoundException extends MarketplaceException {
    public ListingNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND");
    }

    public ListingNotFoundException(UUID listingId) {
        super("Listing not found with ID: " + listingId, HttpStatus.NOT_FOUND, "LISTING_NOT_FOUND");
    }
}
