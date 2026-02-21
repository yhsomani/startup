package com.talentsphere.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CourseDTO {
    private UUID id;
    private UUID instructorId;
    private String instructorName;
    private String title;
    private String subtitle;
    private String description;
    private BigDecimal price;
    private String currency;
    private String thumbnailUrl;
    private String previewVideoUrl;
    private boolean isPublished;
    private long enrollmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // For details view
    private List<SectionDTO> sections;
    private List<SkillDTO> skills;
}
