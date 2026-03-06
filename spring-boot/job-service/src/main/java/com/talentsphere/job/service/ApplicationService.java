package com.talentsphere.job.service;

import com.talentsphere.job.entity.Application;
import com.talentsphere.job.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobListingService jobListingService;

    @Transactional
    public Application applyForJob(UUID jobId, UUID userId, Application applicationData) {
        if (applicationRepository.existsByJobListingIdAndUserId(jobId, userId)) {
            throw new RuntimeException("Already applied for this job");
        }

        Application application = new Application();
        application.setJobListingId(jobId);
        application.setUserId(userId);
        application.setCoverLetter(applicationData.getCoverLetter());
        application.setResumeUrl(applicationData.getResumeUrl());
        application.setStatus(Application.ApplicationStatus.PENDING);
        application.setAppliedAt(LocalDateTime.now());

        application = applicationRepository.save(application);
        jobListingService.incrementApplicationCount(jobId);

        return application;
    }

    public Application getApplication(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public Page<Application> getApplicationsForJob(UUID jobId, Pageable pageable) {
        return applicationRepository.findByJobListingId(jobId, pageable);
    }

    public Page<Application> getApplicationsByUser(UUID userId, Pageable pageable) {
        return applicationRepository.findByUserId(userId, pageable);
    }

    @Transactional
    public Application updateStatus(UUID applicationId, Application.ApplicationStatus status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        application.setStatus(status);
        application.setReviewedAt(LocalDateTime.now());
        
        return applicationRepository.save(application);
    }
}
