package com.talentsphere.company.dto;

import com.talentsphere.company.entity.Company.CompanySize;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyRequest {

    @NotBlank(message = "Company name is required")
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
}
