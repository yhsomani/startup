package com.talentsphere.video.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class VideoUploadResponse {

    private UUID videoId;
    private String message;
    private String storagePath;
}
