package com.talentsphere.job.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "applications")
public class Application extends BaseEntity {

    @Column(name = "job_listing_id", nullable = false)
    private UUID jobListingId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "cover_letter", length = 5000)
    private String coverLetter;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "notes", length = 2000)
    private String notes;

    public enum ApplicationStatus {
        PENDING, REVIEWING, SHORTLISTED, INTERVIEW_SCHEDULED, OFFER_EXTENDED, REJECTED, WITHDRAWN
    }
}
