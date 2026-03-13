package com.talentsphere.video.dto;

import com.talentsphere.video.entity.VideoMetadata.VideoCategory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VideoMetadataResponse {

    private UUID id;
    private String title;
    private String description;
    private String originalFileName;
    private String storagePath;
    private String thumbnailPath;
    private String streamUrl;
    private Long fileSize;
    private Long duration;
    private String resolution;
    private String videoFormat;
    private VideoCategory videoCategory;
    private UUID uploadedBy;
    private Integer viewCount;
    private Boolean processingComplete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
