package com.talentsphere.file.dto;

import com.talentsphere.file.entity.FileMetadata.FileCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    private UUID id;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private String url;
    private FileCategory fileCategory;
    private UUID uploadedBy;
    private Boolean isPublic;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
