package com.talentsphere.video.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.video.dto.VideoMetadataResponse;
import com.talentsphere.video.dto.VideoUploadRequest;
import com.talentsphere.video.dto.VideoUploadResponse;
import com.talentsphere.video.service.VideoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VideoUploadResponse>> uploadVideo(
            @RequestPart("file") MultipartFile file,
            @RequestPart("request") @Valid VideoUploadRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        VideoUploadResponse response = videoService.uploadVideo(file, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoMetadataResponse>> getVideo(@PathVariable UUID id) {
        VideoMetadataResponse video = videoService.getVideo(id);
        return ResponseEntity.ok(ApiResponse.success(video));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<VideoMetadataResponse>>> getVideosByUser(
            @PathVariable UUID userId,
            Pageable pageable) {
        Page<VideoMetadataResponse> videos = videoService.getVideosByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<VideoMetadataResponse>>> getVideosByCategory(
            @PathVariable String category,
            Pageable pageable) {
        Page<VideoMetadataResponse> videos = videoService.getVideosByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteVideo(@PathVariable UUID id) {
        videoService.deleteVideo(id);
        return ResponseEntity.ok(ApiResponse.success("Video deleted successfully"));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<VideoMetadataResponse>> incrementViewCount(@PathVariable UUID id) {
        VideoMetadataResponse video = videoService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success(video));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<Page<VideoMetadataResponse>>> getTrendingVideos(Pageable pageable) {
        Page<VideoMetadataResponse> videos = videoService.getTrendingVideos(pageable);
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("video-service UP"));
    }
}
