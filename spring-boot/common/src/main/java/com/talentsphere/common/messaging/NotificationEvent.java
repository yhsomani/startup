package com.talentsphere.common.messaging;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class NotificationEvent {
    private String id;
    private String type;
    private String userId;
    private String recipient;
    private String subject;
    private String message;
    private Map<String, Object> data;
    private Instant timestamp;
    private String correlationId;

    public NotificationEvent() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public static NotificationEventBuilder builder() {
        return new NotificationEventBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public static class NotificationEventBuilder {
        private String id = UUID.randomUUID().toString();
        private String type;
        private String userId;
        private String recipient;
        private String subject;
        private String message;
        private Map<String, Object> data;
        private Instant timestamp = Instant.now();
        private String correlationId;

        public NotificationEventBuilder type(String type) { this.type = type; return this; }
        public NotificationEventBuilder userId(String userId) { this.userId = userId; return this; }
        public NotificationEventBuilder recipient(String recipient) { this.recipient = recipient; return this; }
        public NotificationEventBuilder subject(String subject) { this.subject = subject; return this; }
        public NotificationEventBuilder message(String message) { this.message = message; return this; }
        public NotificationEventBuilder data(Map<String, Object> data) { this.data = data; return this; }
        public NotificationEventBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public NotificationEventBuilder correlationId(String correlationId) { this.correlationId = correlationId; return this; }

        public NotificationEvent build() {
            NotificationEvent event = new NotificationEvent();
            event.id = this.id;
            event.type = this.type;
            event.userId = this.userId;
            event.recipient = this.recipient;
            event.subject = this.subject;
            event.message = this.message;
            event.data = this.data;
            event.timestamp = this.timestamp;
            event.correlationId = this.correlationId;
            return event;
        }
    }
}
