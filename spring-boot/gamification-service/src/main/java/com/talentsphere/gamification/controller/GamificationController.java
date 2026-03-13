package com.talentsphere.gamification.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.gamification.dto.AddPointsRequest;
import com.talentsphere.gamification.dto.AwardBadgeRequest;
import com.talentsphere.gamification.dto.BadgeDTO;
import com.talentsphere.gamification.dto.UserPointsDTO;
import com.talentsphere.gamification.entity.Badge;
import com.talentsphere.gamification.entity.UserBadge;
import com.talentsphere.gamification.entity.UserPoints;
import com.talentsphere.gamification.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @PostMapping("/badge/award")
    public ResponseEntity<ApiResponse<BadgeDTO>> awardBadge(@RequestBody AwardBadgeRequest request) {
        UserBadge userBadge = gamificationService.awardBadge(request.getUserId(), request.getBadgeId());
        Badge badge = gamificationService.getAllBadges().stream()
                .filter(b -> b.getId().equals(userBadge.getBadgeId()))
                .findFirst()
                .orElse(null);
        
        BadgeDTO dto = mapToBadgeDTO(badge);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto));
    }

    @GetMapping("/user/{userId}/badges")
    public ResponseEntity<ApiResponse<List<BadgeDTO>>> getUserBadges(@PathVariable UUID userId) {
        List<UserBadge> userBadges = gamificationService.getUserBadges(userId);
        List<Badge> allBadges = gamificationService.getAllBadges();
        
        List<BadgeDTO> badges = userBadges.stream()
                .map(ub -> allBadges.stream()
                        .filter(b -> b.getId().equals(ub.getBadgeId()))
                        .findFirst()
                        .map(this::mapToBadgeDTO)
                        .orElse(null))
                .filter(b -> b != null)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(badges));
    }

    @PostMapping("/user/{userId}/points")
    public ResponseEntity<ApiResponse<UserPointsDTO>> addPoints(
            @PathVariable UUID userId,
            @RequestBody AddPointsRequest request) {
        UserPoints userPoints = gamificationService.addPoints(userId, request.getPoints());
        gamificationService.checkAndAwardBadges(userId);
        
        UserPointsDTO dto = mapToUserPointsDTO(userPoints);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/user/{userId}/points")
    public ResponseEntity<ApiResponse<UserPointsDTO>> getUserPoints(@PathVariable UUID userId) {
        UserPoints userPoints = gamificationService.getUserPoints(userId);
        UserPointsDTO dto = mapToUserPointsDTO(userPoints);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<Page<UserPointsDTO>>> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserPoints> leaderboard = gamificationService.getLeaderboard(PageRequest.of(page, size));
        Page<UserPointsDTO> dtoPage = leaderboard.map(this::mapToUserPointsDTO);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<List<BadgeDTO>>> getAllBadges() {
        List<Badge> badges = gamificationService.getAllBadges();
        List<BadgeDTO> dtos = badges.stream().map(this::mapToBadgeDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    private BadgeDTO mapToBadgeDTO(Badge badge) {
        if (badge == null) return null;
        BadgeDTO dto = new BadgeDTO();
        dto.setId(badge.getId());
        dto.setName(badge.getName());
        dto.setDescription(badge.getDescription());
        dto.setIconUrl(badge.getIconUrl());
        dto.setCategory(badge.getCategory().name());
        dto.setPointsRequired(badge.getPointsRequired());
        dto.setCriteria(badge.getCriteria());
        return dto;
    }

    private UserPointsDTO mapToUserPointsDTO(UserPoints userPoints) {
        UserPointsDTO dto = new UserPointsDTO();
        dto.setId(userPoints.getId());
        dto.setUserId(userPoints.getUserId());
        dto.setTotalPoints(userPoints.getTotalPoints());
        dto.setLevel(userPoints.getLevel());
        dto.setCurrentStreak(userPoints.getCurrentStreak());
        dto.setLastActivityAt(userPoints.getLastActivityAt());
        return dto;
    }
}
