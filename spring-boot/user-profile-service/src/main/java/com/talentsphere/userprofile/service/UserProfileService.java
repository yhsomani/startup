package com.talentsphere.userprofile.service;

import com.talentsphere.userprofile.entity.Education;
import com.talentsphere.userprofile.entity.UserProfile;
import com.talentsphere.userprofile.entity.WorkExperience;
import com.talentsphere.userprofile.exception.ProfileNotFoundException;
import com.talentsphere.userprofile.repository.EducationRepository;
import com.talentsphere.userprofile.repository.UserProfileRepository;
import com.talentsphere.userprofile.repository.WorkExperienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final EducationRepository educationRepository;

    @Transactional
    public UserProfile createProfile(UserProfile profile) {
        return userProfileRepository.save(profile);
    }

    public UserProfile getProfile(UUID id) {
        return userProfileRepository.findById(id)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found with id: " + id));
    }

    @Transactional
    public UserProfile updateProfile(UUID id, UserProfile profileUpdate) {
        UserProfile existingProfile = getProfile(id);
        
        if (profileUpdate.getHeadline() != null) {
            existingProfile.setHeadline(profileUpdate.getHeadline());
        }
        if (profileUpdate.getSummary() != null) {
            existingProfile.setSummary(profileUpdate.getSummary());
        }
        if (profileUpdate.getLocation() != null) {
            existingProfile.setLocation(profileUpdate.getLocation());
        }
        if (profileUpdate.getWebsite() != null) {
            existingProfile.setWebsite(profileUpdate.getWebsite());
        }
        if (profileUpdate.getLinkedinUrl() != null) {
            existingProfile.setLinkedinUrl(profileUpdate.getLinkedinUrl());
        }
        if (profileUpdate.getGithubUrl() != null) {
            existingProfile.setGithubUrl(profileUpdate.getGithubUrl());
        }
        if (profileUpdate.getPhoneNumber() != null) {
            existingProfile.setPhoneNumber(profileUpdate.getPhoneNumber());
        }
        if (profileUpdate.getSkills() != null && !profileUpdate.getSkills().isEmpty()) {
            existingProfile.setSkills(profileUpdate.getSkills());
        }
        if (profileUpdate.getLanguages() != null && !profileUpdate.getLanguages().isEmpty()) {
            existingProfile.setLanguages(profileUpdate.getLanguages());
        }
        if (profileUpdate.getCertifications() != null && !profileUpdate.getCertifications().isEmpty()) {
            existingProfile.setCertifications(profileUpdate.getCertifications());
        }
        if (profileUpdate.getEducationLevel() != null) {
            existingProfile.setEducationLevel(profileUpdate.getEducationLevel());
        }
        if (profileUpdate.getYearsOfExperience() != null) {
            existingProfile.setYearsOfExperience(profileUpdate.getYearsOfExperience());
        }
        if (profileUpdate.getPreferredJobType() != null) {
            existingProfile.setPreferredJobType(profileUpdate.getPreferredJobType());
        }
        if (profileUpdate.getPreferredWorkMode() != null) {
            existingProfile.setPreferredWorkMode(profileUpdate.getPreferredWorkMode());
        }
        if (profileUpdate.getPreferredLocations() != null && !profileUpdate.getPreferredLocations().isEmpty()) {
            existingProfile.setPreferredLocations(profileUpdate.getPreferredLocations());
        }
        if (profileUpdate.getOpenToWork() != null) {
            existingProfile.setOpenToWork(profileUpdate.getOpenToWork());
        }
        if (profileUpdate.getActivelyLooking() != null) {
            existingProfile.setActivelyLooking(profileUpdate.getActivelyLooking());
        }

        return userProfileRepository.save(existingProfile);
    }

    @Transactional
    public WorkExperience addWorkExperience(UUID profileId, WorkExperience workExperience) {
        getProfile(profileId);
        workExperience.setProfileId(profileId);
        return workExperienceRepository.save(workExperience);
    }

    @Transactional
    public void deleteWorkExperience(UUID profileId, UUID experienceId) {
        getProfile(profileId);
        WorkExperience experience = workExperienceRepository.findById(experienceId)
                .orElseThrow(() -> new ProfileNotFoundException("Work experience not found with id: " + experienceId));
        
        if (!experience.getProfileId().equals(profileId)) {
            throw new ProfileNotFoundException("Work experience does not belong to this profile");
        }
        
        workExperienceRepository.delete(experience);
    }

    @Transactional
    public Education addEducation(UUID profileId, Education education) {
        getProfile(profileId);
        education.setProfileId(profileId);
        return educationRepository.save(education);
    }

    @Transactional
    public void deleteEducation(UUID profileId, UUID educationId) {
        getProfile(profileId);
        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new ProfileNotFoundException("Education not found with id: " + educationId));
        
        if (!education.getProfileId().equals(profileId)) {
            throw new ProfileNotFoundException("Education does not belong to this profile");
        }
        
        educationRepository.delete(education);
    }

    public Page<UserProfile> searchProfiles(String skills, Pageable pageable) {
        return userProfileRepository.searchProfiles(skills, pageable);
    }
}
