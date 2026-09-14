package com.example.catalog.kafka;

import java.time.Instant;

public class CatalogEvent {
    private String eventId;
    private String eventType;
    private String entityType;
    private String entityId;
    private Object payload;
    private Instant timestamp;

    public CatalogEvent() {
        this.timestamp = Instant.now();
    }

    public CatalogEvent(String eventId, String eventType, String entityType, String entityId, Object payload, Instant timestamp) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.payload = payload;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String eventId;
        private String eventType;
        private String entityType;
        private String entityId;
        private Object payload;
        private Instant timestamp = Instant.now();

        public Builder eventId(String eventId) { this.eventId = eventId; return this; }
        public Builder eventType(String eventType) { this.eventType = eventType; return this; }
        public Builder entityType(String entityType) { this.entityType = entityType; return this; }
        public Builder entityId(String entityId) { this.entityId = entityId; return this; }
        public Builder payload(Object payload) { this.payload = payload; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public CatalogEvent build() {
            return new CatalogEvent(eventId, eventType, entityType, entityId, payload, timestamp);
        }
    }
}
