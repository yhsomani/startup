package com.talentsphere.company.dto;

import com.talentsphere.company.entity.Company.CompanySize;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CompanyResponse {

    private UUID id;
    private String name;
    private String description;
    private String website;
    private String industry;
    private CompanySize size;
    private String location;
    private String logoUrl;
    private String coverImageUrl;
    private Boolean verified;
    private Boolean active;
    private Integer employeeCount;
    private Integer foundedYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
