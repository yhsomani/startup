package com.talentsphere.backend.service;

import com.talentsphere.backend.dto.*;
import com.talentsphere.backend.model.Course;
import com.talentsphere.backend.model.Lesson;
import com.talentsphere.backend.model.Section;
import com.talentsphere.backend.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> listCourses(int page, int limit, UUID instructorId, Boolean isPublished) {
        if (page < 1)
            page = 1;
        if (limit > 100)
            limit = 100;

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        Page<Course> coursePage = courseRepository.findCourses(isPublished, instructorId, pageable);

        List<CourseDTO> courseDTOs = coursePage.getContent().stream()
                .map(this::mapToLiteDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("data", courseDTOs);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", coursePage.getTotalElements());
        pagination.put("totalPages", coursePage.getTotalPages());
        pagination.put("hasNextPage", coursePage.hasNext());
        pagination.put("hasPreviousPage", coursePage.hasPrevious());

        response.put("pagination", pagination);

        return response;
    }

    @Transactional(readOnly = true)
    public CourseDTO getCourseDetails(@NonNull UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // In a real scenario, check if published or user is owner

        return mapToFullDTO(course);
    }

    private CourseDTO mapToLiteDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setInstructorId(course.getInstructor().getId());
        dto.setInstructorName(course.getInstructor().getEmail()); // Using email as name for simplified User model
        dto.setTitle(course.getTitle());
        dto.setSubtitle(course.getSubtitle());
        dto.setDescription(course.getDescription());
        dto.setPrice(course.getPrice());
        dto.setCurrency(course.getCurrency());
        dto.setThumbnailUrl(course.getThumbnailUrl());
        dto.setPreviewVideoUrl(course.getPreviewVideoUrl());
        dto.setPublished(course.isPublished());
        dto.setCreatedAt(course.getCreatedAt());
        dto.setUpdatedAt(course.getUpdatedAt());
        // enrollmentCount would need a separate query or computed field in entity
        return dto;
    }

    private CourseDTO mapToFullDTO(Course course) {
        CourseDTO dto = mapToLiteDTO(course);

        // Map sections
        List<SectionDTO> sections = course.getSections().stream()
                .filter(Section::isActive)
                .sorted((s1, s2) -> s1.getOrderIndex().compareTo(s2.getOrderIndex()))
                .map(this::mapToSectionDTO)
                .collect(Collectors.toList());

        dto.setSections(sections);

        // Map skills
        dto.setSkills(course.getSkills().stream()
                .map(s -> {
                    SkillDTO sDto = new SkillDTO();
                    sDto.setId(s.getId());
                    sDto.setSkillName(s.getSkillName());
                    return sDto;
                })
                .collect(Collectors.toList()));

        return dto;
    }

    private SectionDTO mapToSectionDTO(Section section) {
        SectionDTO dto = new SectionDTO();
        dto.setId(section.getId());
        dto.setTitle(section.getTitle());
        dto.setOrderIndex(section.getOrderIndex());

        List<LessonDTO> lessons = section.getLessons().stream()
                .filter(Lesson::isActive)
                .sorted((l1, l2) -> l1.getOrderIndex().compareTo(l2.getOrderIndex()))
                .map(this::mapToLessonDTO)
                .collect(Collectors.toList());

        dto.setLessons(lessons);
        return dto;
    }

    private LessonDTO mapToLessonDTO(Lesson lesson) {
        LessonDTO dto = new LessonDTO();
        dto.setId(lesson.getId());
        dto.setType(lesson.getType().name());
        dto.setTitle(lesson.getTitle());
        dto.setDescription(lesson.getDescription());
        dto.setOrderIndex(lesson.getOrderIndex());
        dto.setVideoUrl(lesson.getVideoUrl());
        dto.setDuration(lesson.getDuration());
        dto.setChallengeId(lesson.getChallengeId());
        return dto;
    }
}
