package com.talentsphere.backend.controller;

import com.talentsphere.backend.service.ChallengeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/challenges")
public class ChallengeController {

    @Autowired
    private ChallengeService challengeService;

    @PostMapping("/{challengeId}/submit")
    public ResponseEntity<Map<String, Object>> submitSolution(
            @PathVariable UUID challengeId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.accepted().body(challengeService.submitSolution(challengeId, file));
    }

    @GetMapping("/{challengeId}/submissions/{submissionId}")
    public ResponseEntity<Map<String, Object>> getSubmissionStatus(
            @PathVariable UUID challengeId,
            @PathVariable UUID submissionId) {
        return ResponseEntity.ok(challengeService.getSubmissionStatus(challengeId, submissionId));
    }

    @GetMapping("/{challengeId}/leaderboard")
    public ResponseEntity<Map<String, Object>> getLeaderboard(
            @PathVariable UUID challengeId,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(challengeService.getLeaderboard(challengeId, limit));
    }
}
