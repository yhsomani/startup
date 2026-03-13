package com.talentsphere.video.entity;

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
@Table(name = "video_metadata")
public class VideoMetadata extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @Column(name = "stream_url")
    private String streamUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "duration")
    private Long duration;

    @Column(name = "resolution")
    private String resolution;

    @Column(name = "video_format")
    private String videoFormat;

    @Enumerated(EnumType.STRING)
    @Column(name = "video_category")
    private VideoCategory videoCategory;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "processing_complete")
    @Builder.Default
    private Boolean processingComplete = false;

    public enum VideoCategory {
        INTERVIEW, INTRO, DEMO, OTHER
    }
}
