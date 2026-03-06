package com.talentsphere.user.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "user_profiles")
public class UserProfile extends BaseEntity {

    @Column(name = "user_id", unique = true, nullable = false)
    private UUID userId;

    @Column(name = "headline")
    private String headline;

    @Column(name = "summary", length = 2000)
    private String summary;

    @Column(name = "location")
    private String location;

    @Column(name = "phone")
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(name = "is_open_to_work")
    private boolean openToWork = false;

    @Column(name = "is_looking_for_hiring")
    private boolean lookingForHiring = false;

    @Column(name = "company")
    private String company;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_experience", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderBy("startDate DESC")
    private List<Experience> experiences = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_education", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderBy("graduationYear DESC")
    private List<Education> education = new ArrayList<>();

    @Data
    @Embeddable
    public static class Experience {
        @Column(name = "company")
        private String company;
        @Column(name = "title")
        private String title;
        @Column(name = "location")
        private String location;
        @Column(name = "start_date")
        private LocalDate startDate;
        @Column(name = "end_date")
        private LocalDate endDate;
        @Column(name = "description", length = 1000)
        private String description;
        @Column(name = "is_current")
        private boolean current;
    }

    @Data
    @Embeddable
    public static class Education {
        @Column(name = "institution")
        private String institution;
        @Column(name = "degree")
        private String degree;
        @Column(name = "field_of_study")
        private String fieldOfStudy;
        @Column(name = "graduation_year")
        private Integer graduationYear;
        @Column(name = "description", length = 500)
        private String description;
    }
}
