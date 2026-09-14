package com.example.catalog.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class CatalogEventProducer {

    private static final Logger log = LoggerFactory.getLogger(CatalogEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.catalog-events:catalog-events}")
    private String catalogEventsTopic;

    public CatalogEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishEvent(String eventType, String entityType, String entityId, Object payload) {
        CatalogEvent event = CatalogEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .payload(payload)
                .timestamp(Instant.now())
                .build();

        try {
            kafkaTemplate.send(catalogEventsTopic, entityId, event);
            log.info("Published catalog event: type={}, entityType={}, entityId={}", eventType, entityType, entityId);
        } catch (Exception e) {
            log.warn("Failed to publish catalog event to Kafka (proceeding without breaking business flow): {}", e.getMessage());
        }
    }
}
