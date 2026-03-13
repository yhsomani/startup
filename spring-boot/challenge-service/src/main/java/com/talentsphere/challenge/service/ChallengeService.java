package com.talentsphere.challenge.service;

import com.talentsphere.challenge.entity.Challenge;
import com.talentsphere.challenge.entity.ChallengeSubmission;
import com.talentsphere.challenge.exception.ResourceNotFoundException;
import com.talentsphere.challenge.repository.ChallengeRepository;
import com.talentsphere.challenge.repository.ChallengeSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeSubmissionRepository submissionRepository;

    @Transactional
    public Challenge createChallenge(Challenge challenge) {
        challenge.setActive(challenge.getActive() != null ? challenge.getActive() : true);
        challenge.setCreatedAt(LocalDateTime.now());
        return challengeRepository.save(challenge);
    }

    public Challenge getChallenge(UUID id) {
        return challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));
    }

    public Page<Challenge> getAllChallenges(Pageable pageable) {
        return challengeRepository.findAll(pageable);
    }

    public Page<Challenge> getActiveChallenges(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return challengeRepository.findByActiveTrueAndStartDateBeforeAndEndDateAfter(now, now, pageable);
    }

    @Transactional
    public ChallengeSubmission submitSolution(UUID challengeId, UUID userId, String submittedCode, String language) {
        Challenge challenge = getChallenge(challengeId);

        if (!challenge.getActive()) {
            throw new RuntimeException("Challenge is not active");
        }

        if (challenge.getStartDate() != null && LocalDateTime.now().isBefore(challenge.getStartDate())) {
            throw new RuntimeException("Challenge has not started yet");
        }

        if (challenge.getEndDate() != null && LocalDateTime.now().isAfter(challenge.getEndDate())) {
            throw new RuntimeException("Challenge has ended");
        }

        ChallengeSubmission submission = ChallengeSubmission.builder()
                .challengeId(challengeId)
                .userId(userId)
                .submittedCode(submittedCode)
                .language(language)
                .submittedAt(LocalDateTime.now())
                .passed(false)
                .score(0)
                .build();

        return submissionRepository.save(submission);
    }

    @Transactional
    public ChallengeSubmission updateChallengeScore(UUID submissionId, UUID userId, Integer score) {
        ChallengeSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getUserId().equals(userId)) {
            throw new RuntimeException("Submission does not belong to user");
        }

        submission.setScore(score);
        submission.setPassed(score != null && score > 0);

        return submissionRepository.save(submission);
    }

    public List<ChallengeSubmission> getSubmissionsByUser(UUID userId) {
        return submissionRepository.findByUserId(userId);
    }

    public List<LeaderboardEntry> getLeaderboard(UUID challengeId) {
        List<Object[]> results = submissionRepository.findLeaderboardByChallengeId(challengeId);
        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        
        int rank = 1;
        for (Object[] result : results) {
            UUID userId = (UUID) result[0];
            Integer totalScore = ((Number) result[1]).intValue();
            leaderboard.add(new LeaderboardEntry(rank++, userId, totalScore));
        }
        
        return leaderboard;
    }

    public record LeaderboardEntry(int rank, UUID userId, int totalScore) {}
}
