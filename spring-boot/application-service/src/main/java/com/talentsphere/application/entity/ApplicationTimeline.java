package com.talentsphere.application.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "application_timeline")
public class ApplicationTimeline extends BaseEntity {

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "from_status")
    private String fromStatus;

    @Column(name = "to_status", nullable = false)
    private String toStatus;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;
}
