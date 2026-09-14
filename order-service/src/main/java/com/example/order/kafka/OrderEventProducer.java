package com.example.order.kafka;

import com.example.order.kafka.events.OrderEvents;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderEventProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String orderEventsTopic;

    public OrderEventProducer(KafkaTemplate<String, String> kafkaTemplate,
                              ObjectMapper objectMapper,
                              @Value("${app.kafka.topics.order-events:order.events}") String orderEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.orderEventsTopic = orderEventsTopic;
    }

    public <T> void publishEvent(String key, String eventType, T data) {
        try {
            OrderEvents.BaseEvent<T> event = new OrderEvents.BaseEvent<>(eventType, data);
            String jsonPayload = objectMapper.writeValueAsString(event);
            log.info("Publishing Kafka event '{}' with key '{}' to topic '{}'", eventType, key, orderEventsTopic);
            kafkaTemplate.send(orderEventsTopic, key, jsonPayload);
        } catch (Exception e) {
            log.error("Failed to publish Kafka event '{}' for key '{}': {}", eventType, key, e.getMessage(), e);
        }
    }
}
