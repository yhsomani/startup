package com.talentsphere.job.controller;

import com.talentsphere.job.entity.Application;
import com.talentsphere.job.entity.JobListing;
import com.talentsphere.job.service.ApplicationService;
import com.talentsphere.job.service.JobListingService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobListingService jobListingService;
    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobListing>> createJob(@RequestBody JobListing job) {
        JobListing created = jobListingService.createJob(job);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created));
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobListing>> updateJob(
            @PathVariable UUID jobId,
            @RequestBody JobListing job) {
        JobListing updated = jobListingService.updateJob(jobId, job);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobListing>> getJob(@PathVariable UUID jobId) {
        jobListingService.incrementViewCount(jobId);
        JobListing job = jobListingService.getJob(jobId);
        return ResponseEntity.ok(ApiResponse.success(job));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobListing>>> getAllJobs(Pageable pageable) {
        Page<JobListing> jobs = jobListingService.getAllJobs(pageable);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<Page<JobListing>>> getFeaturedJobs(Pageable pageable) {
        Page<JobListing> jobs = jobListingService.getFeaturedJobs(pageable);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @PostMapping("/{jobId}/apply")
    public ResponseEntity<ApiResponse<Application>> applyForJob(
            @PathVariable UUID jobId,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody Application application) {
        Application applied = applicationService.applyForJob(jobId, userId, application);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(applied));
    }

    @GetMapping("/{jobId}/applications")
    public ResponseEntity<ApiResponse<Page<Application>>> getApplicationsForJob(
            @PathVariable UUID jobId,
            Pageable pageable) {
        Page<Application> applications = applicationService.getApplicationsForJob(jobId, pageable);
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("job-service UP"));
    }
}
