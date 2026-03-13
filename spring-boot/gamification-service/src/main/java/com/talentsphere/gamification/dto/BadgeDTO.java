package com.talentsphere.gamification.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class BadgeDTO {
    private UUID id;
    private String name;
    private String description;
    private String iconUrl;
    private String category;
    private Integer pointsRequired;
    private String criteria;
}
