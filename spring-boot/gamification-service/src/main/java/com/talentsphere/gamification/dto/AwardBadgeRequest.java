package com.talentsphere.gamification.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AwardBadgeRequest {
    private UUID userId;
    private UUID badgeId;
}
