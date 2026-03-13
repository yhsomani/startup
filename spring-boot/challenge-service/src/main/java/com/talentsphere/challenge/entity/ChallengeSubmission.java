package com.talentsphere.challenge.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "challenge_submissions")
public class ChallengeSubmission extends BaseEntity {

    @Column(name = "challenge_id", nullable = false)
    private UUID challengeId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "submitted_code", columnDefinition = "TEXT")
    private String submittedCode;

    @Column(nullable = false)
    private String language;

    @Column
    private Integer score;

    @Column(nullable = false)
    @Builder.Default
    private Boolean passed = false;

    @Column(columnDefinition = "TEXT")
    private String output;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
