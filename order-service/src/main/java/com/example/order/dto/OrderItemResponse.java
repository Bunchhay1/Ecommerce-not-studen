package com.example.order.dto;

import com.example.order.entity.OrderItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class OrderItemResponse {

    private String id;
    private String productId;
    private String variantId;
    private String sku;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal subtotal;
    private OffsetDateTime createdAt;

    public OrderItemResponse() {
    }

    public static OrderItemResponse fromEntity(OrderItem entity) {
        OrderItemResponse dto = new OrderItemResponse();
        dto.setId(entity.getId());
        dto.setProductId(entity.getProductId());
        dto.setVariantId(entity.getVariantId());
        dto.setSku(entity.getSku());
        dto.setProductName(entity.getProductName());
        dto.setImageUrl(entity.getImageUrl());
        dto.setQuantity(entity.getQuantity());
        dto.setUnitPrice(entity.getUnitPrice());
        dto.setDiscount(entity.getDiscount());
        dto.setSubtotal(entity.getSubtotal());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
