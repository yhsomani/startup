package com.talentsphere.gamification.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "badges")
public class Badge extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private BadgeCategory category;

    @Column(name = "points_required")
    private Integer pointsRequired;

    @Column(name = "criteria", length = 2000)
    private String criteria;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum BadgeCategory {
        SKILL,
        ACHIEVEMENT,
        MILESTONE,
        SPECIAL
    }
}
