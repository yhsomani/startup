package com.talentsphere.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentsphere.backend.model.OutboxEvent;
import com.talentsphere.backend.repository.OutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RabbitMQEventPublisher implements EventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(RabbitMQEventPublisher.class);

    @Autowired
    private AmqpTemplate amqpTemplate;

    @Autowired
    private OutboxRepository outboxRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void publishEvent(String routingKey, Map<String, Object> eventData) {
        try {
            // Try to publish directly first
            amqpTemplate.convertAndSend("talentsphere.events", routingKey, eventData);
            logger.info("Published event to {}: {}", routingKey, eventData);
        } catch (Exception e) {
            // If direct publish fails, save to outbox for later processing
            logger.warn("Failed to publish event directly, saving to outbox: {}", e.getMessage());
            saveToOutbox(routingKey, eventData);
        }
    }

    private void saveToOutbox(String routingKey, Map<String, Object> eventData) {
        try {
            String aggregateId = (String) eventData.getOrDefault("aggregateId", "unknown");
            String eventType = (String) eventData.getOrDefault("eventType", "unknown");
            String payload = objectMapper.writeValueAsString(eventData);

            OutboxEvent outboxEvent = new OutboxEvent(aggregateId, eventType, routingKey, payload);
            outboxRepository.save(outboxEvent);

            logger.info("Event saved to outbox: aggregateId={}, eventType={}", aggregateId, eventType);
        } catch (Exception e) {
            // If we can't save to outbox either, log a critical error
            logger.error("CRITICAL: Failed to publish event and could not save to outbox: {}", e.getMessage(), e);
        }
    }
}
