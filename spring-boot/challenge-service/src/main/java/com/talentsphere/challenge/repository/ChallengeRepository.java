package com.talentsphere.challenge.repository;

import com.talentsphere.challenge.entity.Challenge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {

    Page<Challenge> findByActiveTrue(Pageable pageable);

    Page<Challenge> findByActiveTrueAndStartDateBeforeAndEndDateAfter(
            LocalDateTime now, LocalDateTime nowAgain, Pageable pageable);

    Page<Challenge> findByCategory(Challenge.Category category, Pageable pageable);

    Page<Challenge> findByDifficulty(Challenge.Difficulty difficulty, Pageable pageable);
}
