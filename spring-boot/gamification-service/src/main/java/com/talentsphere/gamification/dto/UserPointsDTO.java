package com.talentsphere.gamification.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserPointsDTO {
    private UUID id;
    private UUID userId;
    private Integer totalPoints;
    private Integer level;
    private Integer currentStreak;
    private LocalDateTime lastActivityAt;
}
