package com.talentsphere.analytics.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Getter
@Setter
@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "target_id")
    private UUID targetId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public enum EventType {
        JOB_VIEW,
        APPLICATION_SUBMITTED,
        PROFILE_VIEW,
        SEARCH,
        LOGIN,
        LOGOUT
    }
}
