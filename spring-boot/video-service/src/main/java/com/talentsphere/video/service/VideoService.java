package com.talentsphere.video.service;

import com.talentsphere.video.dto.VideoMetadataResponse;
import com.talentsphere.video.dto.VideoUploadRequest;
import com.talentsphere.video.dto.VideoUploadResponse;
import com.talentsphere.video.entity.VideoMetadata;
import com.talentsphere.video.exception.VideoNotFoundException;
import com.talentsphere.video.repository.VideoMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoMetadataRepository videoMetadataRepository;

    @Value("${video.storage.path:./uploads/videos}")
    private String videoStoragePath;

    @Transactional
    public VideoUploadResponse uploadVideo(MultipartFile file, VideoUploadRequest request, UUID uploadedBy) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        
        UUID videoId = UUID.randomUUID();
        String storageFileName = videoId + "." + fileExtension;
        
        Path storagePath = Paths.get(videoStoragePath, storageFileName);
        
        try {
            Files.createDirectories(storagePath.getParent());
            Files.write(storagePath, file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store video file", e);
        }

        VideoMetadata videoMetadata = VideoMetadata.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .originalFileName(originalFileName)
                .storagePath(storagePath.toString())
                .fileSize(file.getSize())
                .videoFormat(fileExtension)
                .videoCategory(request.getVideoCategory())
                .resolution(request.getResolution())
                .uploadedBy(uploadedBy)
                .viewCount(0)
                .processingComplete(true)
                .build();

        VideoMetadata saved = videoMetadataRepository.save(videoMetadata);

        return VideoUploadResponse.builder()
                .videoId(saved.getId())
                .message("Video uploaded successfully")
                .storagePath(storagePath.toString())
                .build();
    }

    @Transactional(readOnly = true)
    public VideoMetadataResponse getVideo(UUID id) {
        VideoMetadata video = videoMetadataRepository.findById(id)
                .orElseThrow(() -> new VideoNotFoundException(id));
        return mapToResponse(video);
    }

    @Transactional(readOnly = true)
    public Page<VideoMetadataResponse> getVideosByUser(UUID userId, Pageable pageable) {
        return videoMetadataRepository.findByUploadedBy(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<VideoMetadataResponse> getVideosByCategory(String category, Pageable pageable) {
        VideoMetadata.VideoCategory videoCategory = VideoMetadata.VideoCategory.valueOf(category.toUpperCase());
        return videoMetadataRepository.findByVideoCategory(videoCategory, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public void deleteVideo(UUID id) {
        VideoMetadata video = videoMetadataRepository.findById(id)
                .orElseThrow(() -> new VideoNotFoundException(id));
        
        try {
            Files.deleteIfExists(Paths.get(video.getStoragePath()));
            if (video.getThumbnailPath() != null) {
                Files.deleteIfExists(Paths.get(video.getThumbnailPath()));
            }
        } catch (IOException e) {
            // Log but don't fail the deletion
        }
        
        videoMetadataRepository.delete(video);
    }

    @Transactional
    public VideoMetadataResponse incrementViewCount(UUID id) {
        VideoMetadata video = videoMetadataRepository.findById(id)
                .orElseThrow(() -> new VideoNotFoundException(id));
        
        video.setViewCount(video.getViewCount() + 1);
        VideoMetadata updated = videoMetadataRepository.save(video);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<VideoMetadataResponse> getTrendingVideos(Pageable pageable) {
        return videoMetadataRepository.findByViewCountGreaterThanEqual(1, pageable)
                .map(this::mapToResponse);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) {
            return "mp4";
        }
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot == -1) {
            return "mp4";
        }
        return fileName.substring(lastDot + 1).toLowerCase();
    }

    private VideoMetadataResponse mapToResponse(VideoMetadata video) {
        return VideoMetadataResponse.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .originalFileName(video.getOriginalFileName())
                .storagePath(video.getStoragePath())
                .thumbnailPath(video.getThumbnailPath())
                .streamUrl(video.getStreamUrl())
                .fileSize(video.getFileSize())
                .duration(video.getDuration())
                .resolution(video.getResolution())
                .videoFormat(video.getVideoFormat())
                .videoCategory(video.getVideoCategory())
                .uploadedBy(video.getUploadedBy())
                .viewCount(video.getViewCount())
                .processingComplete(video.getProcessingComplete())
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }
}
