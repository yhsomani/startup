package com.talentsphere.application.service;

import com.talentsphere.application.entity.ApplicationTimeline;
import com.talentsphere.application.entity.JobApplication;
import com.talentsphere.application.repository.ApplicationTimelineRepository;
import com.talentsphere.application.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final ApplicationTimelineRepository timelineRepository;

    @Transactional
    public JobApplication createApplication(JobApplication application) {
        if (applicationRepository.existsByJobIdAndCandidateId(application.getJobId(), application.getCandidateId())) {
            throw new RuntimeException("Already applied for this job");
        }

        application.setStatus(JobApplication.ApplicationStatus.APPLIED);
        application.setAppliedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        JobApplication saved = applicationRepository.save(application);

        addTimelineEvent(saved.getId(), null, JobApplication.ApplicationStatus.APPLIED.name(), null);

        return saved;
    }

    public JobApplication getApplication(UUID id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public Page<JobApplication> getApplicationsByCandidate(UUID candidateId, Pageable pageable) {
        return applicationRepository.findByCandidateId(candidateId, pageable);
    }

    public Page<JobApplication> getApplicationsByJob(UUID jobId, Pageable pageable) {
        return applicationRepository.findByJobId(jobId, pageable);
    }

    @Transactional
    public JobApplication updateApplicationStatus(UUID applicationId, String newStatus, String comment) {
        JobApplication application = getApplication(applicationId);

        String oldStatus = application.getStatus().name();
        application.setStatus(JobApplication.ApplicationStatus.valueOf(newStatus));
        application.setUpdatedAt(LocalDateTime.now());

        JobApplication saved = applicationRepository.save(application);

        addTimelineEvent(applicationId, oldStatus, newStatus, null);

        return saved;
    }

    @Transactional
    public ApplicationTimeline addTimelineEvent(UUID applicationId, String fromStatus, String toStatus, UUID changedBy) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new RuntimeException("Application not found");
        }

        ApplicationTimeline timeline = new ApplicationTimeline();
        timeline.setApplicationId(applicationId);
        timeline.setFromStatus(fromStatus);
        timeline.setToStatus(toStatus);
        timeline.setChangedBy(changedBy);
        timeline.setChangedAt(LocalDateTime.now());

        return timelineRepository.save(timeline);
    }

    public List<ApplicationTimeline> getApplicationTimeline(UUID applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new RuntimeException("Application not found");
        }
        return timelineRepository.findByApplicationIdOrderByChangedAtDesc(applicationId);
    }

    @Transactional
    public JobApplication withdrawApplication(UUID applicationId) {
        JobApplication application = getApplication(applicationId);

        if (application.getStatus() == JobApplication.ApplicationStatus.WITHDRAWN) {
            throw new RuntimeException("Application already withdrawn");
        }

        String oldStatus = application.getStatus().name();
        application.setStatus(JobApplication.ApplicationStatus.WITHDRAWN);
        application.setUpdatedAt(LocalDateTime.now());

        JobApplication saved = applicationRepository.save(application);

        addTimelineEvent(applicationId, oldStatus, JobApplication.ApplicationStatus.WITHDRAWN.name(), null);

        return saved;
    }

    @Transactional
    public void deleteApplication(UUID applicationId) {
        JobApplication application = getApplication(applicationId);
        applicationRepository.delete(application);
    }
}
