package com.talentsphere.backend.controller;

import com.talentsphere.backend.dto.CourseDTO;
import com.talentsphere.backend.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) UUID instructorId,
            @RequestParam(required = false, defaultValue = "true") Boolean isPublished) {

        return ResponseEntity.ok(courseService.listCourses(page, limit, instructorId, isPublished));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseDTO> getCourseDetails(@PathVariable @NonNull UUID courseId) {
        return ResponseEntity.ok(courseService.getCourseDetails(courseId));
    }
}
