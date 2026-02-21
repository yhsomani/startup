package com.talentsphere.backend.service;

import java.util.Map;

public interface EventPublisher {
    void publishEvent(String routingKey, Map<String, Object> eventData);
}
