package com.talentsphere.video.repository;

import com.talentsphere.video.entity.VideoMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, UUID> {

    Page<VideoMetadata> findByUploadedBy(UUID uploadedBy, Pageable pageable);

    Page<VideoMetadata> findByVideoCategory(VideoMetadata.VideoCategory videoCategory, Pageable pageable);

    Page<VideoMetadata> findByProcessingCompleteFalse(Pageable pageable);

    Page<VideoMetadata> findByViewCountGreaterThanEqual(Integer minViews, Pageable pageable);
}
