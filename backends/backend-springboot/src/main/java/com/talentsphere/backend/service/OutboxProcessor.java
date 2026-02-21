package com.talentsphere.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentsphere.backend.model.OutboxEvent;
import com.talentsphere.backend.model.OutboxEvent.OutboxStatus;
import com.talentsphere.backend.repository.OutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class OutboxProcessor {

    private static final Logger logger = LoggerFactory.getLogger(OutboxProcessor.class);
    private static final int MAX_RETRIES = 5;
    private static final int BATCH_SIZE = 100;

    @Autowired
    private OutboxRepository outboxRepository;

    @Autowired
    private AmqpTemplate amqpTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 5000) // Run every 5 seconds
    @Transactional
    public void processOutbox() {
        List<OutboxEvent> pendingEvents = outboxRepository
            .findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(OutboxStatus.PENDING, MAX_RETRIES)
            .stream()
            .limit(BATCH_SIZE)
            .toList();

        if (pendingEvents.isEmpty()) {
            return;
        }

        logger.info("Processing {} pending outbox events", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                Map<String, Object> payload = objectMapper.readValue(event.getPayload(), Map.class);
                amqpTemplate.convertAndSend("talentsphere.events", event.getRoutingKey(), payload);
                
                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                outboxRepository.save(event);
                
                logger.info("Successfully processed outbox event: id={}, type={}", event.getId(), event.getEventType());
            } catch (Exception e) {
                logger.error("Failed to process outbox event: id={}, error={}", event.getId(), e.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(e.getMessage());
                
                if (event.getRetryCount() >= MAX_RETRIES) {
                    event.setStatus(OutboxStatus.FAILED);
                    logger.error("Outbox event permanently failed after {} retries: id={}", MAX_RETRIES, event.getId());
                }
                
                outboxRepository.save(event);
            }
        }
    }

    public long getPendingCount() {
        return outboxRepository.countByStatus(OutboxStatus.PENDING);
    }

    public long getFailedCount() {
        return outboxRepository.countByStatus(OutboxStatus.FAILED);
    }
}
