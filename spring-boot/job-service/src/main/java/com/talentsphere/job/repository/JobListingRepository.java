package com.talentsphere.job.repository;

import com.talentsphere.job.entity.JobListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobListingRepository extends JpaRepository<JobListing, UUID> {
    Page<JobListing> findByActiveTrue(Pageable pageable);
    Page<JobListing> findByCompanyId(UUID companyId, Pageable pageable);
    Page<JobListing> findByFeaturedTrueAndActiveTrue(Pageable pageable);
    List<JobListing> findByActiveTrue();
}
