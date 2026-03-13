package com.talentsphere.challenge.controller;

import com.talentsphere.challenge.entity.Challenge;
import com.talentsphere.challenge.entity.ChallengeSubmission;
import com.talentsphere.challenge.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @PostMapping
    public ResponseEntity<Challenge> createChallenge(@RequestBody Challenge challenge) {
        Challenge created = challengeService.createChallenge(challenge);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Challenge> getChallenge(@PathVariable UUID id) {
        Challenge challenge = challengeService.getChallenge(id);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping
    public ResponseEntity<Page<Challenge>> getAllChallenges(Pageable pageable) {
        Page<Challenge> challenges = challengeService.getAllChallenges(pageable);
        return ResponseEntity.ok(challenges);
    }

    @GetMapping("/active")
    public ResponseEntity<Page<Challenge>> getActiveChallenges(Pageable pageable) {
        Page<Challenge> challenges = challengeService.getActiveChallenges(pageable);
        return ResponseEntity.ok(challenges);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ChallengeSubmission> submitSolution(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestParam String code,
            @RequestParam String language) {
        ChallengeSubmission submission = challengeService.submitSolution(id, userId, code, language);
        return ResponseEntity.status(HttpStatus.CREATED).body(submission);
    }

    @GetMapping("/user/{userId}/submissions")
    public ResponseEntity<List<ChallengeSubmission>> getSubmissionsByUser(@PathVariable UUID userId) {
        List<ChallengeSubmission> submissions = challengeService.getSubmissionsByUser(userId);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<ChallengeService.LeaderboardEntry>> getLeaderboard(@PathVariable UUID id) {
        List<ChallengeService.LeaderboardEntry> leaderboard = challengeService.getLeaderboard(id);
        return ResponseEntity.ok(leaderboard);
    }

    @PutMapping("/{challengeId}/submissions/{submissionId}/score")
    public ResponseEntity<ChallengeSubmission> updateScore(
            @PathVariable UUID challengeId,
            @PathVariable UUID submissionId,
            @RequestParam UUID userId,
            @RequestParam Integer score) {
        ChallengeSubmission submission = challengeService.updateChallengeScore(submissionId, userId, score);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("challenge-service UP");
    }
}
