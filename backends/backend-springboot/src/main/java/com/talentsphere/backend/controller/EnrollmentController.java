package com.talentsphere.backend.controller;

import com.talentsphere.backend.dto.EnrollmentRequest;
import com.talentsphere.backend.service.ProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
public class EnrollmentController {

    @Autowired
    private ProgressService progressService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEnrollment(@RequestBody EnrollmentRequest request) {
        return new ResponseEntity<>(progressService.createEnrollment(request.getCourseId()), HttpStatus.CREATED);
    }

    @PutMapping("/{enrollmentId}/lessons/{lessonId}/complete")
    public ResponseEntity<Map<String, Object>> markLessonComplete(
            @PathVariable UUID enrollmentId,
            @PathVariable UUID lessonId) {
        return ResponseEntity.ok(progressService.markLessonComplete(enrollmentId, lessonId));
    }

    @GetMapping("/{enrollmentId}/progress")
    public ResponseEntity<Map<String, Object>> getProgressDetails(@PathVariable UUID enrollmentId) {
        return ResponseEntity.ok(progressService.getProgressDetails(enrollmentId));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId.toString() == principal.id.toString() or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUserEnrollments(@PathVariable UUID userId) {
        return ResponseEntity.ok(progressService.getUserEnrollments(userId));
    }
}
