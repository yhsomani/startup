package com.talentsphere.user.controller;

import com.talentsphere.user.dto.UserProfileDTO;
import com.talentsphere.user.service.UserProfileService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDTO>> createProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileDTO dto) {
        UserProfileDTO profile = userProfileService.createProfile(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(profile));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileDTO dto) {
        UserProfileDTO profile = userProfileService.updateProfile(userId, dto);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getProfile(
            @PathVariable UUID userId) {
        UserProfileDTO profile = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("user-service UP"));
    }
}
