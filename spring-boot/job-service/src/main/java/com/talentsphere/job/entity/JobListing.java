package com.talentsphere.job.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "job_listings")
public class JobListing extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "location")
    private String location;

    @Column(name = "job_type")
    @Enumerated(EnumType.STRING)
    private JobType jobType;

    @Column(name = "work_mode")
    @Enumerated(EnumType.STRING)
    private WorkMode workMode;

    @Column(name = "experience_level")
    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Column(name = "salary_min")
    private BigDecimal salaryMin;

    @Column(name = "salary_max")
    private BigDecimal salaryMax;

    @Column(name = "salary_currency")
    private String salaryCurrency;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_required_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    private List<String> requiredSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_benefits", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "benefit")
    private List<String> benefits = new ArrayList<>();

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_featured")
    private boolean featured = false;

    @Column(name = "view_count")
    private int viewCount = 0;

    @Column(name = "application_count")
    private int applicationCount = 0;

    public enum JobType {
        FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, TEMPORARY
    }

    public enum WorkMode {
        REMOTE, HYBRID, ONSITE
    }

    public enum ExperienceLevel {
        ENTRY, MID, SENIOR, LEAD, EXECUTIVE
    }
}
