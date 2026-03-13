package com.talentsphere.gamification.service;

import com.talentsphere.gamification.entity.Badge;
import com.talentsphere.gamification.entity.UserBadge;
import com.talentsphere.gamification.entity.UserPoints;
import com.talentsphere.gamification.repository.BadgeRepository;
import com.talentsphere.gamification.repository.UserBadgeRepository;
import com.talentsphere.gamification.repository.UserPointsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserPointsRepository userPointsRepository;

    @Transactional
    public UserBadge awardBadge(UUID userId, UUID badgeId) {
        if (userBadgeRepository.existsByUserIdAndBadgeId(userId, badgeId)) {
            throw new RuntimeException("Badge already awarded to user");
        }

        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new RuntimeException("Badge not found"));

        UserBadge userBadge = new UserBadge();
        userBadge.setUserId(userId);
        userBadge.setBadgeId(badgeId);
        userBadge.setEarnedAt(LocalDateTime.now());

        return userBadgeRepository.save(userBadge);
    }

    public List<UserBadge> getUserBadges(UUID userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    @Transactional
    public UserPoints addPoints(UUID userId, Integer points) {
        UserPoints userPoints = userPointsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPoints newUserPoints = new UserPoints();
                    newUserPoints.setUserId(userId);
                    newUserPoints.setTotalPoints(0);
                    newUserPoints.setLevel(1);
                    newUserPoints.setCurrentStreak(0);
                    return newUserPoints;
                });

        userPoints.setTotalPoints(userPoints.getTotalPoints() + points);
        userPoints.setLevel(calculateLevel(userPoints.getTotalPoints()));
        userPoints.setLastActivityAt(LocalDateTime.now());

        updateStreak(userPoints);

        return userPointsRepository.save(userPoints);
    }

    private void updateStreak(UserPoints userPoints) {
        LocalDateTime lastActivity = userPoints.getLastActivityAt();
        LocalDateTime now = LocalDateTime.now();

        if (lastActivity == null) {
            userPoints.setCurrentStreak(1);
            return;
        }

        if (lastActivity.toLocalDate().equals(now.toLocalDate())) {
            return;
        }

        if (lastActivity.toLocalDate().plusDays(1).equals(now.toLocalDate())) {
            userPoints.setCurrentStreak(userPoints.getCurrentStreak() + 1);
        } else {
            userPoints.setCurrentStreak(1);
        }
    }

    public UserPoints getUserPoints(UUID userId) {
        return userPointsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPoints newUserPoints = new UserPoints();
                    newUserPoints.setUserId(userId);
                    newUserPoints.setTotalPoints(0);
                    newUserPoints.setLevel(1);
                    newUserPoints.setCurrentStreak(0);
                    return newUserPoints;
                });
    }

    public Page<UserPoints> getLeaderboard(Pageable pageable) {
        return userPointsRepository.findAllByOrderByTotalPointsDesc(pageable);
    }

    @Transactional
    public List<UserBadge> checkAndAwardBadges(UUID userId) {
        UserPoints userPoints = getUserPoints(userId);
        List<Badge> allBadges = badgeRepository.findAll();
        List<UserBadge> existingBadges = userBadgeRepository.findByUserId(userId);

        List<UUID> existingBadgeIds = existingBadges.stream()
                .map(UserBadge::getBadgeId)
                .toList();

        List<Badge> eligibleBadges = allBadges.stream()
                .filter(badge -> !existingBadgeIds.contains(badge.getId()))
                .filter(badge -> badge.getPointsRequired() != null)
                .filter(badge -> userPoints.getTotalPoints() >= badge.getPointsRequired())
                .toList();

        for (Badge badge : eligibleBadges) {
            awardBadge(userId, badge.getId());
        }

        return userBadgeRepository.findByUserId(userId);
    }

    public Integer calculateLevel(Integer points) {
        if (points == null || points < 0) {
            return 1;
        }
        if (points >= 10000) return 10;
        if (points >= 7500) return 9;
        if (points >= 5500) return 8;
        if (points >= 4000) return 7;
        if (points >= 2800) return 6;
        if (points >= 1900) return 5;
        if (points >= 1200) return 4;
        if (points >= 600) return 3;
        if (points >= 200) return 2;
        return 1;
    }

    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }
}
