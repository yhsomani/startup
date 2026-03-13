package com.talentsphere.application.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "job_applications")
public class JobApplication extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "cover_letter", length = 5000)
    private String coverLetter;

    @Column(name = "resume_id")
    private UUID resumeId;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "current_stage")
    private String currentStage;

    @Column(name = "interview_stages", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> interviewStages;

    @Column(name = "ranking")
    private Integer ranking;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ApplicationStatus {
        APPLIED, SCREENING, INTERVIEW, OFFER, REJECTED, WITHDRAWN
    }

    @Converter
    public static class StringListConverter implements jakarta.persistence.AttributeConverter<List<String>, String> {
        @Override
        public String convertToDatabaseColumn(List<String> attribute) {
            if (attribute == null || attribute.isEmpty()) {
                return null;
            }
            return String.join(",", attribute);
        }

        @Override
        public List<String> convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.isEmpty()) {
                return null;
            }
            return List.of(dbData.split(","));
        }
    }
}
