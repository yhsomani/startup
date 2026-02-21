package com.talentsphere.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Certificate entity representing a course completion certificate.
 * Issued when a student completes 100% of a course.
 */
@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "enrollment_id", nullable = false)
    private String enrollmentId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "course_id", nullable = false)
    private String courseId;

    @Column(name = "course_title", nullable = false)
    private String courseTitle;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "certificate_url", nullable = false)
    private String certificateUrl;

    @Column(name = "verification_code", nullable = false, unique = true)
    private String verificationCode;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @PrePersist
    protected void onCreate() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}
