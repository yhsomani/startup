package com.talentsphere.backend.controller;

import com.talentsphere.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Search candidates by skill and percentile.
     * Accessible by Recruiters and Admins.
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> searchCandidates(
            @RequestParam String skill,
            @RequestParam(defaultValue = "0") int minPercentile) {
        return ResponseEntity.ok(userService.searchCandidates(skill, minPercentile));
    }

    /**
     * Get certificates for a specific user.
     * Accessible by Recruiters, Admins, or the user themselves.
     */
    @GetMapping("/{userId}/certificates")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN') or #userId.toString() == authentication.name")
    public ResponseEntity<List<Map<String, Object>>> getUserCertificates(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserCertificates(userId));
    }
}
