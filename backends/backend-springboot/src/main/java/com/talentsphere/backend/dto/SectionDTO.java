package com.talentsphere.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SectionDTO {
    private UUID id;
    private String title;
    private Integer orderIndex;
    private List<LessonDTO> lessons;
}
