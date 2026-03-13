package com.talentsphere.analytics.controller;

import com.talentsphere.analytics.entity.AnalyticsEvent;
import com.talentsphere.analytics.entity.DailyMetrics;
import com.talentsphere.analytics.service.AnalyticsService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<AnalyticsEvent>> trackEvent(@RequestBody AnalyticsEvent event) {
        AnalyticsEvent saved = analyticsService.trackEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<AnalyticsEvent>>> getUserActivity(
            @PathVariable UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable) {
        Page<AnalyticsEvent> events = analyticsService.getUserActivity(userId, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getJobPerformance(@PathVariable UUID jobId) {
        Map<String, Object> performance = analyticsService.getJobPerformance(jobId);
        return ResponseEntity.ok(ApiResponse.success(performance));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyMetrics>>> getDailyMetrics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<DailyMetrics> metrics = analyticsService.getDailyMetrics(from, to);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/platform")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformStats() {
        Map<String, Object> stats = analyticsService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/engagement/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEngagementScore(@PathVariable UUID userId) {
        Map<String, Object> engagement = analyticsService.calculateEngagementScore(userId);
        return ResponseEntity.ok(ApiResponse.success(engagement));
    }
}
