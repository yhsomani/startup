package com.talentsphere.gamification.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "user_points")
public class UserPoints extends BaseEntity {

    @Column(name = "user_id", unique = true, nullable = false)
    private UUID userId;

    @Column(name = "total_points")
    private Integer totalPoints = 0;

    @Column(name = "level")
    private Integer level = 1;

    @Column(name = "current_streak")
    private Integer currentStreak = 0;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;
}
