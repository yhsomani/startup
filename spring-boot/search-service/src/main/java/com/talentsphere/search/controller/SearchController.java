package com.talentsphere.search.controller;

import com.talentsphere.search.service.SearchService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> globalSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> results = searchService.globalSearch(q, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchJobs(
            @RequestParam String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> results = searchService.searchJobs(q, location, jobType, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchUsers(
            @RequestParam String q,
            @RequestParam(required = false) String skills,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> results = searchService.searchUsers(q, skills, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchCourses(
            @RequestParam String q,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> results = searchService.searchCourses(q, category, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("search-service UP"));
    }
}
