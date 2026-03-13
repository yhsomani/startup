package com.talentsphere.challenge.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "challenges")
public class Challenge extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "points_reward")
    private Integer pointsReward;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(name = "problem_statement", columnDefinition = "TEXT")
    private String problemStatement;

    @Column(name = "test_cases", columnDefinition = "TEXT")
    private String testCases;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "allowed_languages", columnDefinition = "TEXT")
    private String allowedLanguages;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    public enum Difficulty {
        EASY, MEDIUM, HARD, EXPERT
    }

    public enum Category {
        CODING, QUIZ, PROJECT, OTHER
    }
}
