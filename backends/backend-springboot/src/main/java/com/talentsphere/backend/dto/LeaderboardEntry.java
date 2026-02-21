package com.talentsphere.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public interface LeaderboardEntry {
    UUID getUserId();

    String getUsername();

    BigDecimal getBestScore();

    Long getSubmissionCount();

    LocalDateTime getBestSubmissionAt();
}
