package com.talentsphere.file.repository;

import com.talentsphere.file.entity.FileMetadata;
import com.talentsphere.file.entity.FileMetadata.FileCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {

    List<FileMetadata> findByUploadedBy(UUID uploadedBy);

    Page<FileMetadata> findByFileCategory(FileCategory fileCategory, Pageable pageable);

    List<FileMetadata> findByExpiresAtBefore(LocalDateTime dateTime);
}
