package com.example.order.kafka.events;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public class OrderEvents {

    public static class BaseEvent<T> {
        private String eventId;
        private String eventType;
        private OffsetDateTime timestamp;
        private T data;

        public BaseEvent() {
            this.eventId = UUID.randomUUID().toString();
            this.timestamp = OffsetDateTime.now(ZoneOffset.UTC);
        }

        public BaseEvent(String eventType, T data) {
            this.eventId = UUID.randomUUID().toString();
            this.eventType = eventType;
            this.timestamp = OffsetDateTime.now(ZoneOffset.UTC);
            this.data = data;
        }

        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public OffsetDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }

        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }

    public static class OrderEventPayload {
        private String orderId;
        private String orderNumber;
        private String userId;
        private String status;
        private BigDecimal total;
        private String currency;
        private String paymentStatus;
        private String shippingStatus;

        public OrderEventPayload() {}

        public OrderEventPayload(String orderId, String orderNumber, String userId, String status,
                                 BigDecimal total, String currency, String paymentStatus, String shippingStatus) {
            this.orderId = orderId;
            this.orderNumber = orderNumber;
            this.userId = userId;
            this.status = status;
            this.total = total;
            this.currency = currency;
            this.paymentStatus = paymentStatus;
            this.shippingStatus = shippingStatus;
        }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public BigDecimal getTotal() { return total; }
        public void setTotal(BigDecimal total) { this.total = total; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

        public String getShippingStatus() { return shippingStatus; }
        public void setShippingStatus(String shippingStatus) { this.shippingStatus = shippingStatus; }
    }
}
