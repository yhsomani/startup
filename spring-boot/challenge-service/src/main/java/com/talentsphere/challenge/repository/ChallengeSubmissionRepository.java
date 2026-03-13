package com.talentsphere.challenge.repository;

import com.talentsphere.challenge.entity.ChallengeSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChallengeSubmissionRepository extends JpaRepository<ChallengeSubmission, UUID> {

    List<ChallengeSubmission> findByUserId(UUID userId);

    Page<ChallengeSubmission> findByUserId(UUID userId, Pageable pageable);

    List<ChallengeSubmission> findByChallengeId(UUID challengeId);

    Page<ChallengeSubmission> findByChallengeId(UUID challengeId, Pageable pageable);

    Optional<ChallengeSubmission> findByChallengeIdAndUserId(UUID challengeId, UUID userId);

    @Query("SELECT cs FROM ChallengeSubmission cs WHERE cs.challengeId = :challengeId AND cs.passed = true ORDER BY cs.score DESC, cs.submittedAt ASC")
    Page<ChallengeSubmission> findTopByChallengeIdOrderByScoreDesc(@Param("challengeId") UUID challengeId, Pageable pageable);

    @Query("SELECT cs.userId, SUM(cs.score) as totalScore FROM ChallengeSubmission cs WHERE cs.passed = true GROUP BY cs.userId ORDER BY totalScore DESC")
    List<Object[]> findLeaderboard();

    @Query("SELECT cs.userId, SUM(cs.score) as totalScore FROM ChallengeSubmission cs WHERE cs.challengeId = :challengeId AND cs.passed = true GROUP BY cs.userId ORDER BY totalScore DESC")
    List<Object[]> findLeaderboardByChallengeId(@Param("challengeId") UUID challengeId);
}
