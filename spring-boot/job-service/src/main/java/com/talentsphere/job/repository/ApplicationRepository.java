package com.talentsphere.job.repository;

import com.talentsphere.job.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    Page<Application> findByJobListingId(UUID jobListingId, Pageable pageable);
    Page<Application> findByUserId(UUID userId, Pageable pageable);
    List<Application> findByJobListingIdAndUserId(UUID jobListingId, UUID userId);
    boolean existsByJobListingIdAndUserId(UUID jobListingId, UUID userId);
}
