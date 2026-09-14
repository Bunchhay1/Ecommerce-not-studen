package com.example.marketplace.outbox;

import com.example.marketplace.entity.OutboxEvent;
import com.example.marketplace.enums.OutboxStatus;
import com.example.marketplace.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
@EnableScheduling
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.seller-events:seller.events}")
    private String sellerEventsTopic;

    @Value("${app.kafka.topics.listing-events:listing.events}")
    private String listingEventsTopic;

    @Value("${app.kafka.topics.marketplace-events:marketplace.events}")
    private String marketplaceEventsTopic;

    public OutboxPublisher(OutboxEventRepository outboxEventRepository,
                           KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc(
                OutboxStatus.PENDING, PageRequest.of(0, 50));

        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            String topic = resolveTopic(event.getAggregateType());
            try {
                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload());
                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(OffsetDateTime.now(ZoneOffset.UTC));
                outboxEventRepository.save(event);
                log.debug("Successfully published outbox event '{}' [ID: {}] to topic '{}'",
                        event.getEventType(), event.getId(), topic);
            } catch (Exception e) {
                log.warn("Failed to publish outbox event '{}' [ID: {}]: {}",
                        event.getEventType(), event.getId(), e.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxStatus.FAILED);
                }
                outboxEventRepository.save(event);
            }
        }
    }

    private String resolveTopic(String aggregateType) {
        if ("Seller".equalsIgnoreCase(aggregateType)) {
            return sellerEventsTopic;
        } else if ("Listing".equalsIgnoreCase(aggregateType)) {
            return listingEventsTopic;
        }
        return marketplaceEventsTopic;
    }
}
