package com.talentsphere.user.service;

import com.talentsphere.user.dto.UserProfileDTO;
import com.talentsphere.user.entity.UserProfile;
import com.talentsphere.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    @Transactional
    public UserProfileDTO createProfile(UUID userId, UserProfileDTO dto) {
        if (userProfileRepository.existsByUserId(userId)) {
            throw new RuntimeException("Profile already exists for this user");
        }

        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        updateProfileFromDTO(profile, dto);

        profile = userProfileRepository.save(profile);
        return mapToDTO(profile);
    }

    @Transactional
    public UserProfileDTO updateProfile(UUID userId, UserProfileDTO dto) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        updateProfileFromDTO(profile, dto);
        profile = userProfileRepository.save(profile);
        return mapToDTO(profile);
    }

    public UserProfileDTO getProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return mapToDTO(profile);
    }

    private void updateProfileFromDTO(UserProfile profile, UserProfileDTO dto) {
        profile.setHeadline(dto.getHeadline());
        profile.setSummary(dto.getSummary());
        profile.setLocation(dto.getLocation());
        profile.setPhone(dto.getPhone());
        profile.setDateOfBirth(dto.getDateOfBirth());
        profile.setAvatarUrl(dto.getAvatarUrl());
        profile.setResumeUrl(dto.getResumeUrl());
        profile.setLinkedinUrl(dto.getLinkedinUrl());
        profile.setGithubUrl(dto.getGithubUrl());
        profile.setWebsiteUrl(dto.getWebsiteUrl());
        profile.setOpenToWork(dto.isOpenToWork());
        profile.setLookingForHiring(dto.isLookingForHiring());
        profile.setCompany(dto.getCompany());
        profile.setJobTitle(dto.getJobTitle());
        profile.setYearsExperience(dto.getYearsExperience());
        profile.setSkills(dto.getSkills());
    }

    private UserProfileDTO mapToDTO(UserProfile profile) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(profile.getUserId());
        dto.setHeadline(profile.getHeadline());
        dto.setSummary(profile.getSummary());
        dto.setLocation(profile.getLocation());
        dto.setPhone(profile.getPhone());
        dto.setDateOfBirth(profile.getDateOfBirth());
        dto.setAvatarUrl(profile.getAvatarUrl());
        dto.setResumeUrl(profile.getResumeUrl());
        dto.setLinkedinUrl(profile.getLinkedinUrl());
        dto.setGithubUrl(profile.getGithubUrl());
        dto.setWebsiteUrl(profile.getWebsiteUrl());
        dto.setOpenToWork(profile.isOpenToWork());
        dto.setLookingForHiring(profile.isLookingForHiring());
        dto.setCompany(profile.getCompany());
        dto.setJobTitle(profile.getJobTitle());
        dto.setYearsExperience(profile.getYearsExperience());
        dto.setSkills(profile.getSkills());
        return dto;
    }
}
