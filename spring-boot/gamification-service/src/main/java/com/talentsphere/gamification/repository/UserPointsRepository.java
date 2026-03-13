package com.talentsphere.gamification.repository;

import com.talentsphere.gamification.entity.UserPoints;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPointsRepository extends JpaRepository<UserPoints, UUID> {
    Optional<UserPoints> findByUserId(UUID userId);
    Page<UserPoints> findAllByOrderByTotalPointsDesc(Pageable pageable);
}
