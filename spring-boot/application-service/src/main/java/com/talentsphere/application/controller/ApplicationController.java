package com.talentsphere.application.controller;

import com.talentsphere.application.entity.ApplicationTimeline;
import com.talentsphere.application.entity.JobApplication;
import com.talentsphere.application.service.ApplicationService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobApplication>> createApplication(@RequestBody JobApplication application) {
        JobApplication created = applicationService.createApplication(application);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobApplication>> getApplication(@PathVariable UUID id) {
        JobApplication application = applicationService.getApplication(id);
        return ResponseEntity.ok(ApiResponse.success(application));
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<ApiResponse<Page<JobApplication>>> getApplicationsByCandidate(
            @PathVariable UUID candidateId,
            Pageable pageable) {
        Page<JobApplication> applications = applicationService.getApplicationsByCandidate(candidateId, pageable);
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<Page<JobApplication>>> getApplicationsByJob(
            @PathVariable UUID jobId,
            Pageable pageable) {
        Page<JobApplication> applications = applicationService.getApplicationsByJob(jobId, pageable);
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<JobApplication>> updateApplicationStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String comment) {
        JobApplication updated = applicationService.updateApplicationStatus(id, status, comment);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<ApplicationTimeline>>> getApplicationTimeline(
            @PathVariable UUID id) {
        List<ApplicationTimeline> timeline = applicationService.getApplicationTimeline(id);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable UUID id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<JobApplication>> withdrawApplication(@PathVariable UUID id) {
        JobApplication withdrawn = applicationService.withdrawApplication(id);
        return ResponseEntity.ok(ApiResponse.success(withdrawn));
    }
}
