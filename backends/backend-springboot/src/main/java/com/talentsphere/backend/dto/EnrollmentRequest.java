package com.talentsphere.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class EnrollmentRequest {
    private UUID courseId;
    private UUID userId; // Optional, usually from token
}
