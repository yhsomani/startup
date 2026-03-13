package com.talentsphere.common.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(EventPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishNotification(NotificationEvent event) {
        try {
            String routingKey = "notification." + event.getType();
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                routingKey,
                event
            );
            logger.info("Published notification event: type={}, userId={}, correlationId={}",
                    event.getType(), event.getUserId(), event.getCorrelationId());
        } catch (Exception e) {
            logger.error("Failed to publish notification event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to publish event", e);
        }
    }

    public void publish(String routingKey, Object event) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, event);
            logger.debug("Published event to routingKey={}", routingKey);
        } catch (Exception e) {
            logger.error("Failed to publish event to routingKey={}: {}", routingKey, e.getMessage(), e);
            throw new RuntimeException("Failed to publish event", e);
        }
    }
}
