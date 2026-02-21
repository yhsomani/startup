package com.talentsphere.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class LessonDTO {
    private UUID id;
    private String type;
    private String title;
    private String description;
    private Integer orderIndex;
    private String videoUrl;
    private Integer duration;
    private UUID challengeId;
}
