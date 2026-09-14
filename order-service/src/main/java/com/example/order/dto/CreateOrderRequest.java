package com.example.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateOrderRequest {

    private String paymentMethod = "CARD";
    private String idempotencyKey;
    private String currency = "USD";
    private String notes;

    @NotNull(message = "Shipping address is required")
    @Valid
    private OrderAddressDto shippingAddress;

    private OrderAddressDto billingAddress;

    // Optional direct items if checking out without a cart
    @Valid
    private List<DirectOrderItem> directItems;

    public CreateOrderRequest() {
    }

    public static class DirectOrderItem {
        private String productId;
        private String variantId;
        private String sku;
        private String productName;
        private String imageUrl;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;

        public DirectOrderItem() {}

        public DirectOrderItem(String productId, String variantId, String sku, String productName, String imageUrl, Integer quantity, java.math.BigDecimal unitPrice) {
            this.productId = productId;
            this.variantId = variantId;
            this.sku = sku;
            this.productName = productName;
            this.imageUrl = imageUrl;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
        }

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public String getVariantId() { return variantId; }
        public void setVariantId(String variantId) { this.variantId = variantId; }

        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }

        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public java.math.BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(java.math.BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }

    // Getters and Setters
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OrderAddressDto getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(OrderAddressDto shippingAddress) { this.shippingAddress = shippingAddress; }

    public OrderAddressDto getBillingAddress() { return billingAddress; }
    public void setBillingAddress(OrderAddressDto billingAddress) { this.billingAddress = billingAddress; }

    public List<DirectOrderItem> getDirectItems() { return directItems; }
    public void setDirectItems(List<DirectOrderItem> directItems) { this.directItems = directItems; }
}
