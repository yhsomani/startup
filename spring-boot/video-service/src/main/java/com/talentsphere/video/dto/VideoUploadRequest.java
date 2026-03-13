package com.talentsphere.video.dto;

import com.talentsphere.video.entity.VideoMetadata.VideoCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoUploadRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private VideoCategory videoCategory;

    private String resolution;
}
