package com.talentsphere.file.dto;

import com.talentsphere.file.entity.FileMetadata.FileCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadRequest {

    @NotNull(message = "File category is required")
    private FileCategory fileCategory;

    private Boolean isPublic;

    private Integer expirationMinutes;
}
