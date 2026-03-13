package com.talentsphere.gamification.repository;

import com.talentsphere.gamification.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, UUID> {
}
