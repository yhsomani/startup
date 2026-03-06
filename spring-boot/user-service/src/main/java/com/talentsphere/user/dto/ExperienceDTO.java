package com.talentsphere.user.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExperienceDTO {
    private String company;
    private String title;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private boolean current;
}

@Data
class EducationDTO {
    private String institution;
    private String degree;
    private String fieldOfStudy;
    private Integer graduationYear;
    private String description;
}
