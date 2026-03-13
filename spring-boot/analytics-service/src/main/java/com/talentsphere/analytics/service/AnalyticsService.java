package com.talentsphere.analytics.service;

import com.talentsphere.analytics.entity.AnalyticsEvent;
import com.talentsphere.analytics.entity.DailyMetrics;
import com.talentsphere.analytics.repository.AnalyticsEventRepository;
import com.talentsphere.analytics.repository.DailyMetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final DailyMetricsRepository dailyMetricsRepository;

    @Transactional
    public AnalyticsEvent trackEvent(AnalyticsEvent event) {
        if (event.getTimestamp() == null) {
            event.setTimestamp(LocalDateTime.now());
        }
        return analyticsEventRepository.save(event);
    }

    public Page<AnalyticsEvent> getUserActivity(UUID userId, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        if (from == null || to == null) {
            return analyticsEventRepository.findByUserId(userId, pageable);
        }
        List<AnalyticsEvent> events = analyticsEventRepository.findByUserIdAndTimestampBetween(userId, from, to);
        return Page.empty(pageable);
    }

    public Map<String, Object> getJobPerformance(UUID jobId) {
        List<AnalyticsEvent> jobViews = analyticsEventRepository.findByTargetIdAndTargetType(jobId, "JOB");
        
        Map<String, Object> performance = new HashMap<>();
        performance.put("jobId", jobId);
        performance.put("totalViews", jobViews.stream()
                .filter(e -> e.getEventType() == AnalyticsEvent.EventType.JOB_VIEW)
                .count());
        performance.put("totalApplications", jobViews.stream()
                .filter(e -> e.getEventType() == AnalyticsEvent.EventType.APPLICATION_SUBMITTED)
                .count());
        
        long last24Hours = jobViews.stream()
                .filter(e -> e.getTimestamp().isAfter(LocalDateTime.now().minusHours(24)))
                .count();
        performance.put("viewsLast24Hours", last24Hours);
        
        return performance;
    }

    public List<DailyMetrics> getDailyMetrics(LocalDate from, LocalDate to) {
        return dailyMetricsRepository.findByDateBetween(from, to);
    }

    public Map<String, Object> getPlatformStats() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalUsers", dailyMetricsRepository.sumTotalUsersBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumTotalUsersBetween(thirtyDaysAgo, today) : 0);
        stats.put("activeUsers", dailyMetricsRepository.sumActiveUsersBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumActiveUsersBetween(thirtyDaysAgo, today) : 0);
        stats.put("totalJobs", dailyMetricsRepository.sumTotalJobsBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumTotalJobsBetween(thirtyDaysAgo, today) : 0);
        stats.put("totalApplications", dailyMetricsRepository.sumTotalApplicationsBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumTotalApplicationsBetween(thirtyDaysAgo, today) : 0);
        stats.put("totalCompanies", dailyMetricsRepository.sumTotalCompaniesBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumTotalCompaniesBetween(thirtyDaysAgo, today) : 0);
        stats.put("searchesPerformed", dailyMetricsRepository.sumSearchesPerformedBetween(thirtyDaysAgo, today) != null 
                ? dailyMetricsRepository.sumSearchesPerformedBetween(thirtyDaysAgo, today) : 0);
        
        if (dailyMetricsRepository.averageActiveUsersBetween(thirtyDaysAgo, today) != null) {
            stats.put("averageDailyActiveUsers", dailyMetricsRepository.averageActiveUsersBetween(thirtyDaysAgo, today));
        } else {
            stats.put("averageDailyActiveUsers", 0);
        }
        
        return stats;
    }

    public Map<String, Object> calculateEngagementScore(UUID userId) {
        List<Object[]> eventCounts = analyticsEventRepository.countEventsByUserId(userId);
        
        Map<AnalyticsEvent.EventType, Long> eventTypeCounts = new HashMap<>();
        for (Object[] row : eventCounts) {
            AnalyticsEvent.EventType eventType = (AnalyticsEvent.EventType) row[0];
            Long count = (Long) row[1];
            eventTypeCounts.put(eventType, count);
        }
        
        double engagementScore = 0.0;
        
        engagementScore += eventTypeCounts.getOrDefault(AnalyticsEvent.EventType.JOB_VIEW, 0L) * 1.0;
        engagementScore += eventTypeCounts.getOrDefault(AnalyticsEvent.EventType.APPLICATION_SUBMITTED, 0L) * 5.0;
        engagementScore += eventTypeCounts.getOrDefault(AnalyticsEvent.EventType.PROFILE_VIEW, 0L) * 2.0;
        engagementScore += eventTypeCounts.getOrDefault(AnalyticsEvent.EventType.SEARCH, 0L) * 0.5;
        engagementScore += eventTypeCounts.getOrDefault(AnalyticsEvent.EventType.LOGIN, 0L) * 0.3;
        
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("engagementScore", Math.round(engagementScore * 100.0) / 100.0);
        result.put("eventBreakdown", eventTypeCounts);
        
        String engagementLevel;
        if (engagementScore >= 100) {
            engagementLevel = "HIGH";
        } else if (engagementScore >= 50) {
            engagementLevel = "MEDIUM";
        } else if (engagementScore >= 10) {
            engagementLevel = "LOW";
        } else {
            engagementLevel = "MINIMAL";
        }
        result.put("engagementLevel", engagementLevel);
        
        return result;
    }

    @Transactional
    public DailyMetrics updateDailyMetrics(DailyMetrics metrics) {
        LocalDate today = LocalDate.now();
        DailyMetrics existing = dailyMetricsRepository.findByDate(today).orElse(null);
        
        if (existing != null) {
            existing.setTotalUsers(metrics.getTotalUsers() != null ? metrics.getTotalUsers() : existing.getTotalUsers());
            existing.setActiveUsers(metrics.getActiveUsers() != null ? metrics.getActiveUsers() : existing.getActiveUsers());
            existing.setTotalJobs(metrics.getTotalJobs() != null ? metrics.getTotalJobs() : existing.getTotalJobs());
            existing.setTotalApplications(metrics.getTotalApplications() != null ? metrics.getTotalApplications() : existing.getTotalApplications());
            existing.setTotalCompanies(metrics.getTotalCompanies() != null ? metrics.getTotalCompanies() : existing.getTotalCompanies());
            existing.setSearchesPerformed(metrics.getSearchesPerformed() != null ? metrics.getSearchesPerformed() : existing.getSearchesPerformed());
            return dailyMetricsRepository.save(existing);
        }
        
        metrics.setDate(today);
        return dailyMetricsRepository.save(metrics);
    }
}
