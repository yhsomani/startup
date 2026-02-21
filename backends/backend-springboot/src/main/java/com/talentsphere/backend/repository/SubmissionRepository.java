package com.talentsphere.backend.repository;

import com.talentsphere.backend.dto.LeaderboardEntry;
import com.talentsphere.backend.model.Submission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    long countByUserIdAndChallengeIdAndStatusIn(UUID userId, UUID challengeId,
            List<Submission.SubmissionStatus> statuses);

    @Query("SELECT s.user.id as userId, s.user.email as username, MAX(s.score) as bestScore, " +
            "COUNT(s) as submissionCount, MAX(s.gradedAt) as bestSubmissionAt " +
            "FROM Submission s " +
            "WHERE s.challenge.id = :challengeId AND s.status = 'passed' AND s.isActive = true " +
            "GROUP BY s.user.id, s.user.email " +
            "ORDER BY bestScore DESC, bestSubmissionAt ASC")
    List<LeaderboardEntry> findLeaderboard(@Param("challengeId") UUID challengeId, Pageable pageable);
}
