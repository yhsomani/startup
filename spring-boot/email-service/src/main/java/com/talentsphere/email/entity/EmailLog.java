package com.talentsphere.email.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String to;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmailStatus status = EmailStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime sentAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EmailStatus {
        SENT,
        FAILED,
        PENDING
    }
}
