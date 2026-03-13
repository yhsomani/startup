package com.talentsphere.analytics.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Getter
@Setter
@Entity
@Table(name = "daily_metrics")
public class DailyMetrics extends BaseEntity {

    @Column(name = "date", unique = true, nullable = false)
    private LocalDate date;

    @Column(name = "total_users")
    private Integer totalUsers = 0;

    @Column(name = "active_users")
    private Integer activeUsers = 0;

    @Column(name = "total_jobs")
    private Integer totalJobs = 0;

    @Column(name = "total_applications")
    private Integer totalApplications = 0;

    @Column(name = "total_companies")
    private Integer totalCompanies = 0;

    @Column(name = "searches_performed")
    private Integer searchesPerformed = 0;
}
