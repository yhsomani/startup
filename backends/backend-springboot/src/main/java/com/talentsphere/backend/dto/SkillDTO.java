package com.talentsphere.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SkillDTO {
    private UUID id;
    private String skillName;
}
