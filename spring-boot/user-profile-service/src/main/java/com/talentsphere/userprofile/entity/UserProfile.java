package com.talentsphere.userprofile.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    private String headline;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private String location;

    private String website;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "phone_number")
    private String phoneNumber;

    @ElementCollection
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_languages", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "language")
    @Builder.Default
    private List<String> languages = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_certifications", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "certification")
    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @Column(name = "education_level")
    private String educationLevel;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_job_type")
    private JobType preferredJobType;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_work_mode")
    private WorkMode preferredWorkMode;

    @ElementCollection
    @CollectionTable(name = "user_preferred_locations", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preferred_location")
    @Builder.Default
    private List<String> preferredLocations = new ArrayList<>();

    @Column(name = "open_to_work")
    private Boolean openToWork;

    @Column(name = "actively_looking")
    private Boolean activelyLooking;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "profileId", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkExperience> workExperiences = new ArrayList<>();

    @OneToMany(mappedBy = "profileId", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Education> educations = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum JobType {
        FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
    }

    public enum WorkMode {
        REMOTE, HYBRID, ONSITE
    }
}
