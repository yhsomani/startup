package com.talentsphere.file.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.file.dto.FileUploadRequest;
import com.talentsphere.file.dto.FileUploadResponse;
import com.talentsphere.file.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "fileCategory", required = false) String fileCategory,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic,
            @RequestParam(value = "expirationMinutes", required = false) Integer expirationMinutes,
            @RequestHeader("X-User-Id") String userId) {

        log.info("Received file upload request: {} for user: {}", file.getOriginalFilename(), userId);

        FileUploadRequest request = new FileUploadRequest();
        request.setFileCategory(com.talentsphere.file.entity.FileMetadata.FileCategory.valueOf(fileCategory));
        request.setIsPublic(isPublic);
        request.setExpirationMinutes(expirationMinutes);

        FileUploadResponse response = fileService.uploadFile(file, request, UUID.fromString(userId));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getFile(@PathVariable UUID id) {
        log.info("Received get file request for id: {}", id);
        FileUploadResponse response = fileService.getFile(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getFilesByUser(@PathVariable UUID userId) {
        log.info("Received get files request for user: {}", userId);
        List<FileUploadResponse> files = fileService.getFilesByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFile(@PathVariable UUID id) {
        log.info("Received delete file request for id: {}", id);
        fileService.deleteFile(id);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("File deleted successfully")
                .build());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID id) {
        log.info("Received download file request for id: {}", id);
        
        FileUploadResponse fileMeta = fileService.getFile(id);
        byte[] fileContent = fileService.getFileContent(id);

        ByteArrayResource resource = new ByteArrayResource(fileContent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMeta.getOriginalFileName() + "\"")
                .contentType(MediaType.parseMediaType(fileMeta.getContentType()))
                .contentLength(fileMeta.getFileSize())
                .body(resource);
    }

    @GetMapping("/{id}/presigned")
    public ResponseEntity<ApiResponse<String>> generatePresignedUrl(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "60") int expirationMinutes) {
        log.info("Received generate presigned URL request for id: {}", id);
        String presignedUrl = fileService.generatePresignedUrl(id, expirationMinutes);
        return ResponseEntity.ok(ApiResponse.success(presignedUrl));
    }
}
