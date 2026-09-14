package com.example.marketplace.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MarketplaceException.class)
    public ResponseEntity<Map<String, Object>> handleMarketplaceException(MarketplaceException ex) {
        log.warn("Marketplace error: {} [{}]", ex.getMessage(), ex.getErrorCode());
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("errorCode", ex.getErrorCode());
        body.put("message", ex.getMessage());
        body.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("errorCode", "VALIDATION_FAILED");
        body.put("message", "Validation failed for request parameters");
        body.put("errors", errors);
        body.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("errorCode", "ACCESS_DENIED");
        body.put("message", ex.getMessage());
        body.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception occurred: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("errorCode", "INTERNAL_SERVER_ERROR");
        body.put("message", "An unexpected error occurred. Please try again later.");
        body.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
