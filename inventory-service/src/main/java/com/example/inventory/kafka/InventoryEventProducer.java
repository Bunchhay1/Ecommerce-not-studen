package com.example.inventory.kafka;

import com.example.inventory.kafka.events.InventoryEvents;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class InventoryEventProducer {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String inventoryEventsTopic;

    public InventoryEventProducer(KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper,
                                  @Value("${app.kafka.topics.inventory-events:inventory.events}") String inventoryEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.inventoryEventsTopic = inventoryEventsTopic;
    }

    public <T> void publishEvent(String key, String eventType, T data) {
        try {
            InventoryEvents.BaseEvent<T> event = new InventoryEvents.BaseEvent<>(eventType, data);
            String jsonPayload = objectMapper.writeValueAsString(event);
            log.info("Publishing Kafka event '{}' with key '{}' to topic '{}'", eventType, key, inventoryEventsTopic);
            kafkaTemplate.send(inventoryEventsTopic, key, jsonPayload);
        } catch (Exception e) {
            log.error("Failed to publish Kafka event '{}' for key '{}': {}", eventType, key, e.getMessage(), e);
        }
    }
}
