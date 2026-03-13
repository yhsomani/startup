package com.talentsphere.file.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "file_metadata")
public class FileMetadata extends BaseEntity {

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "url")
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_category", nullable = false)
    private FileCategory fileCategory = FileCategory.OTHER;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Override
    @Column(name = "created_at", updatable = false)
    public LocalDateTime getCreatedAt() {
        return super.getCreatedAt();
    }

    public enum FileCategory {
        RESUME,
        COVER_LETTER,
        CERTIFICATE,
        IMAGE,
        OTHER
    }
}
