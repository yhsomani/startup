package com.talentsphere.userprofile.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.userprofile.entity.Education;
import com.talentsphere.userprofile.entity.UserProfile;
import com.talentsphere.userprofile.entity.WorkExperience;
import com.talentsphere.userprofile.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserProfile>> createProfile(@Valid @RequestBody UserProfile profile) {
        UserProfile created = userProfileService.createProfile(profile);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(@PathVariable UUID id) {
        UserProfile profile = userProfileService.getProfile(id);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UserProfile profile) {
        UserProfile updated = userProfileService.updateProfile(id, profile);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PostMapping("/{id}/experience")
    public ResponseEntity<ApiResponse<WorkExperience>> addWorkExperience(
            @PathVariable UUID id,
            @Valid @RequestBody WorkExperience experience) {
        WorkExperience added = userProfileService.addWorkExperience(id, experience);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(added));
    }

    @DeleteMapping("/{id}/experience/{expId}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkExperience(
            @PathVariable UUID id,
            @PathVariable UUID expId) {
        userProfileService.deleteWorkExperience(id, expId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/education")
    public ResponseEntity<ApiResponse<Education>> addEducation(
            @PathVariable UUID id,
            @Valid @RequestBody Education education) {
        Education added = userProfileService.addEducation(id, education);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(added));
    }

    @DeleteMapping("/{id}/education/{eduId}")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @PathVariable UUID id,
            @PathVariable UUID eduId) {
        userProfileService.deleteEducation(id, eduId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<UserProfile>>> searchProfiles(
            @RequestParam(required = false) String skills,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<UserProfile> profiles = userProfileService.searchProfiles(skills, pageable);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }
}
