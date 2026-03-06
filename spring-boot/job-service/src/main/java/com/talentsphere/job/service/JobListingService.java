package com.talentsphere.job.service;

import com.talentsphere.job.entity.JobListing;
import com.talentsphere.job.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobListingService {

    private final JobListingRepository jobListingRepository;

    @Transactional
    public JobListing createJob(JobListing job) {
        return jobListingRepository.save(job);
    }

    @Transactional
    public JobListing updateJob(UUID jobId, JobListing jobData) {
        JobListing job = jobListingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        job.setTitle(jobData.getTitle());
        job.setDescription(jobData.getDescription());
        job.setLocation(jobData.getLocation());
        job.setJobType(jobData.getJobType());
        job.setWorkMode(jobData.getWorkMode());
        job.setExperienceLevel(jobData.getExperienceLevel());
        job.setSalaryMin(jobData.getSalaryMin());
        job.setSalaryMax(jobData.getSalaryMax());
        job.setRequiredSkills(jobData.getRequiredSkills());
        job.setBenefits(jobData.getBenefits());
        
        return jobListingRepository.save(job);
    }

    public JobListing getJob(UUID jobId) {
        return jobListingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    public Page<JobListing> getAllJobs(Pageable pageable) {
        return jobListingRepository.findByActiveTrue(pageable);
    }

    public Page<JobListing> getJobsByCompany(UUID companyId, Pageable pageable) {
        return jobListingRepository.findByCompanyId(companyId, pageable);
    }

    public Page<JobListing> getFeaturedJobs(Pageable pageable) {
        return jobListingRepository.findByFeaturedTrueAndActiveTrue(pageable);
    }

    @Transactional
    public void incrementViewCount(UUID jobId) {
        JobListing job = jobListingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        job.setViewCount(job.getViewCount() + 1);
        jobListingRepository.save(job);
    }

    @Transactional
    public void incrementApplicationCount(UUID jobId) {
        JobListing job = jobListingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        job.setApplicationCount(job.getApplicationCount() + 1);
        jobListingRepository.save(job);
    }
}
