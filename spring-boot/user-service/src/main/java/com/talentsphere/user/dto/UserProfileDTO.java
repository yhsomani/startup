package com.talentsphere.user.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UserProfileDTO {
    private java.util.UUID userId;
    private String headline;
    private String summary;
    private String location;
    private String phone;
    private LocalDate dateOfBirth;
    private String avatarUrl;
    private String resumeUrl;
    private String linkedinUrl;
    private String githubUrl;
    private String websiteUrl;
    private boolean openToWork;
    private boolean lookingForHiring;
    private String company;
    private String jobTitle;
    private Integer yearsExperience;
    private List<String> skills;
    private List<ExperienceDTO> experiences;
    private List<EducationDTO> education;
}
