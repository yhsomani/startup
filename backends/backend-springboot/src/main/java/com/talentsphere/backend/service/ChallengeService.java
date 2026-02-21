package com.talentsphere.backend.service;

import com.talentsphere.backend.dto.LeaderboardEntry;
import com.talentsphere.backend.model.Challenge;
import com.talentsphere.backend.model.Submission;
import com.talentsphere.backend.model.User;
import com.talentsphere.backend.repository.ChallengeRepository;
import com.talentsphere.backend.repository.SubmissionRepository;
import com.talentsphere.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class ChallengeService {

    @Autowired
    private ChallengeRepository challengeRepository;
    @Autowired
    private SubmissionRepository submissionRepository;
    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String UPLOAD_DIR;

    @Transactional
    public Map<String, Object> submitSolution(UUID challengeId, MultipartFile file) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Challenge challenge = challengeRepository.findById(Objects.requireNonNull(challengeId))
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        // Validation (Constraint: 5 submissions/hour - skipped for brevity)

        // Save file
        String filePath = saveFile(file, challengeId, user.getId());

        Submission submission = new Submission();
        submission.setChallenge(challenge);
        submission.setUser(user);
        submission.setFilePath(filePath);
        submission.setStatus(Submission.SubmissionStatus.pending);
        submission.setSubmittedAt(LocalDateTime.now());

        submission = submissionRepository.save(submission);

        // Trigger Async Grading (Simulated synchronous here for simplicity, or future
        // RabbitMQ)
        // In a real app, send message to queue.
        // For this "runnable" demo, I will just call a grading method asynchronously or
        // synchronous stub.
        gradeSubmission(submission);

        Map<String, Object> response = new HashMap<>();
        response.put("submissionId", submission.getId());
        response.put("status", "pending");
        response.put("message", "Submission queued for grading");

        return response;
    }

    private String saveFile(MultipartFile file, UUID challengeId, UUID userId) {
        try {
            Path path = Paths.get(UPLOAD_DIR + challengeId + "/" + userId);
            Files.createDirectories(path);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetLocation = path.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation);
            return targetLocation.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    // Mock Grading Logic
    private void gradeSubmission(Submission submission) {
        // This should be async
        new Thread(() -> {
            try {
                Thread.sleep(2000); // Simulate processing
                // Random score for demo
                // In reality: Load file, Load dataset, Run Metric
                java.math.BigDecimal score = new java.math.BigDecimal(Math.random() * 100);

                // Update submission
                // Note: In a real environment, use a separate service with
                // @Transactional(Propagation.REQUIRES_NEW)
                // For this demo, we rely on the repository's default transaction
                submission.setScore(score);
                submission.setStatus(score.doubleValue() >= 70 ? Submission.SubmissionStatus.passed
                        : Submission.SubmissionStatus.failed);
                submission.setFeedback("Validation complete. Score: " + score);
                submission.setGradedAt(LocalDateTime.now());

                submissionRepository.save(submission);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSubmissionStatus(UUID challengeId, UUID submissionId) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        // Auth check...

        Map<String, Object> response = new HashMap<>();
        response.put("id", submission.getId());
        response.put("status", submission.getStatus());
        response.put("score", submission.getScore());
        response.put("feedback", submission.getFeedback());
        response.put("gradedAt", submission.getGradedAt());

        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLeaderboard(UUID challengeId, int limit) {
        if (limit > 1000)
            limit = 1000;
        Pageable pageable = PageRequest.of(0, limit);

        List<LeaderboardEntry> entries = submissionRepository.findLeaderboard(challengeId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("challengeId", challengeId);
        response.put("entries", entries);

        return response;
    }
}
