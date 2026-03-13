package com.talentsphere.file.service;

import com.talentsphere.file.dto.FileUploadRequest;
import com.talentsphere.file.dto.FileUploadResponse;
import com.talentsphere.file.entity.FileMetadata;
import com.talentsphere.file.entity.FileMetadata.FileCategory;
import com.talentsphere.file.exception.FileNotFoundException;
import com.talentsphere.file.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;

    @Value("${file.upload.directory:./uploads}")
    private String uploadDirectory;

    @Value("${file.base-url:http://localhost:3013}")
    private String baseUrl;

    @Transactional
    public FileUploadResponse uploadFile(MultipartFile file, FileUploadRequest request, UUID uploadedBy) {
        log.info("Uploading file: {} by user: {}", file.getOriginalFilename(), uploadedBy);

        try {
            Path uploadPath = Paths.get(uploadDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            UUID fileId = UUID.randomUUID();
            String extension = getFileExtension(file.getOriginalFilename());
            String storedFileName = fileId.toString() + extension;

            Path filePath = uploadPath.resolve(storedFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            FileMetadata metadata = new FileMetadata();
            metadata.setFileName(storedFileName);
            metadata.setOriginalFileName(file.getOriginalFilename());
            metadata.setContentType(file.getContentType());
            metadata.setFileSize(file.getSize());
            metadata.setStoragePath(filePath.toString());
            metadata.setFileCategory(request.getFileCategory() != null ? request.getFileCategory() : FileCategory.OTHER);
            metadata.setUploadedBy(uploadedBy);
            metadata.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : false);

            if (request.getExpirationMinutes() != null && request.getExpirationMinutes() > 0) {
                metadata.setExpiresAt(LocalDateTime.now().plusMinutes(request.getExpirationMinutes()));
            }

            FileMetadata savedMetadata = fileMetadataRepository.save(metadata);

            String url = baseUrl + "/api/v1/files/" + savedMetadata.getId() + "/download";
            savedMetadata.setUrl(url);
            savedMetadata = fileMetadataRepository.save(savedMetadata);

            log.info("File uploaded successfully with id: {}", savedMetadata.getId());

            return mapToResponse(savedMetadata);

        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public FileUploadResponse getFile(UUID id) {
        log.info("Fetching file with id: {}", id);
        FileMetadata metadata = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new FileNotFoundException("File not found with id: " + id));

        return mapToResponse(metadata);
    }

    @Transactional(readOnly = true)
    public List<FileUploadResponse> getFilesByUser(UUID userId) {
        log.info("Fetching files for user: {}", userId);
        return fileMetadataRepository.findByUploadedBy(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFile(UUID id) {
        log.info("Deleting file with id: {}", id);
        FileMetadata metadata = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new FileNotFoundException("File not found with id: " + id));

        try {
            Path filePath = Paths.get(metadata.getStoragePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete physical file: {}", e.getMessage());
        }

        fileMetadataRepository.delete(metadata);
        log.info("File deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public String generatePresignedUrl(UUID id, int expirationMinutes) {
        log.info("Generating presigned URL for file: {} with expiration: {} minutes", id, expirationMinutes);
        
        FileMetadata metadata = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new FileNotFoundException("File not found with id: " + id));

        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(expirationMinutes);
        metadata.setExpiresAt(expirationTime);
        fileMetadataRepository.save(metadata);

        return baseUrl + "/api/v1/files/" + id + "/download?expires=" + expirationTime.toString();
    }

    @Transactional
    public void cleanupExpiredFiles() {
        log.info("Starting cleanup of expired files");
        List<FileMetadata> expiredFiles = fileMetadataRepository.findByExpiresAtBefore(LocalDateTime.now());
        
        for (FileMetadata metadata : expiredFiles) {
            try {
                Path filePath = Paths.get(metadata.getStoragePath());
                Files.deleteIfExists(filePath);
                fileMetadataRepository.delete(metadata);
                log.info("Deleted expired file: {}", metadata.getId());
            } catch (IOException e) {
                log.warn("Failed to delete expired file: {}", metadata.getId(), e);
            }
        }
        
        log.info("Cleanup complete. Deleted {} expired files", expiredFiles.size());
    }

    public byte[] getFileContent(UUID id) {
        FileMetadata metadata = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new FileNotFoundException("File not found with id: " + id));

        try {
            Path filePath = Paths.get(metadata.getStoragePath());
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        }
    }

    private FileUploadResponse mapToResponse(FileMetadata metadata) {
        return FileUploadResponse.builder()
                .id(metadata.getId())
                .fileName(metadata.getFileName())
                .originalFileName(metadata.getOriginalFileName())
                .contentType(metadata.getContentType())
                .fileSize(metadata.getFileSize())
                .url(metadata.getUrl())
                .fileCategory(metadata.getFileCategory())
                .uploadedBy(metadata.getUploadedBy())
                .isPublic(metadata.getIsPublic())
                .expiresAt(metadata.getExpiresAt())
                .createdAt(metadata.getCreatedAt())
                .build();
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
    }
}
