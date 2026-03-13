package com.talentsphere.common.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class AuditLogger {

    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String USER_ID_MDC = "userId";
    private static final String CORRELATION_ID_MDC = "correlationId";

    @Async
    public void logAuthEvent(String eventType, String userId, String email, String ipAddress, 
                            String userAgent, boolean success, String failureReason) {
        log(eventType, Map.of(
            "userId", userId != null ? userId : "anonymous",
            "email", email != null ? email : "",
            "ipAddress", ipAddress != null ? ipAddress : "",
            "userAgent", userAgent != null ? userAgent : "",
            "success", success,
            "failureReason", failureReason != null ? failureReason : ""
        ));
    }

    @Async
    public void logDataAccess(String eventType, String userId, String resourceType, 
                             String resourceId, String action, Map<String, Object> details) {
        log(eventType, Map.of(
            "userId", userId != null ? userId : "anonymous",
            "resourceType", resourceType,
            "resourceId", resourceId != null ? resourceId : "",
            "action", action,
            "details", details != null ? details : Map.of()
        ));
    }

    @Async
    public void logSecurityEvent(String eventType, String userId, String ipAddress,
                                 String details, boolean blocked) {
        log(eventType, Map.of(
            "userId", userId != null ? userId : "anonymous",
            "ipAddress", ipAddress != null ? ipAddress : "",
            "details", details != null ? details : "",
            "blocked", blocked
        ));
    }

    @Async
    public void logBusinessEvent(String eventType, String userId, String entityType,
                                String entityId, Map<String, Object> metadata) {
        log(eventType, Map.of(
            "userId", userId != null ? userId : "anonymous",
            "entityType", entityType,
            "entityId", entityId != null ? entityId : "",
            "metadata", metadata != null ? metadata : Map.of()
        ));
    }

    private void log(String eventType, Map<String, Object> data) {
        try {
            AuditEvent event = AuditEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .timestamp(Instant.now().toString())
                    .eventType(eventType)
                    .userId(MDC.get(USER_ID_MDC))
                    .correlationId(MDC.get(CORRELATION_ID_MDC))
                    .data(data)
                    .build();

            auditLog.info(objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            auditLog.error("Failed to serialize audit event: {}", e.getMessage());
        }
    }

    public void setUserContext(String userId) {
        if (userId != null) {
            MDC.put(USER_ID_MDC, userId);
        }
    }

    public void clearContext() {
        MDC.remove(USER_ID_MDC);
        MDC.remove(CORRELATION_ID_MDC);
    }

    public static class AuditEvent {
        private String id;
        private String timestamp;
        private String eventType;
        private String userId;
        private String correlationId;
        private Map<String, Object> data;

        public static AuditEventBuilder builder() {
            return new AuditEventBuilder();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }

        public static class AuditEventBuilder {
            private String id;
            private String timestamp;
            private String eventType;
            private String userId;
            private String correlationId;
            private Map<String, Object> data;

            public AuditEventBuilder id(String id) { this.id = id; return this; }
            public AuditEventBuilder timestamp(String timestamp) { this.timestamp = timestamp; return this; }
            public AuditEventBuilder eventType(String eventType) { this.eventType = eventType; return this; }
            public AuditEventBuilder userId(String userId) { this.userId = userId; return this; }
            public AuditEventBuilder correlationId(String correlationId) { this.correlationId = correlationId; return this; }
            public AuditEventBuilder data(Map<String, Object> data) { this.data = data; return this; }
            public AuditEvent build() {
                AuditEvent event = new AuditEvent();
                event.id = this.id;
                event.timestamp = this.timestamp;
                event.eventType = this.eventType;
                event.userId = this.userId;
                event.correlationId = this.correlationId;
                event.data = this.data;
                return event;
            }
        }
    }
}
