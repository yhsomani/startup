package com.talentsphere.company.entity;

import com.talentsphere.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(length = 5000)
    private String description;

    private String website;

    private String industry;

    @Enumerated(EnumType.STRING)
    @Column(name = "company_size")
    private CompanySize size;

    private String location;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "verified")
    private Boolean verified = false;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "founded_year")
    private Integer foundedYear;

    public enum CompanySize {
        STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE
    }
}
