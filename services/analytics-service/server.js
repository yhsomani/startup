/**
 * TalentSphere Analytics Service Main Entry Point
 * Initializes analytics service and starts API server
 */

const AnalyticsService = require("./analytics-service");
const AnalyticsAPI = require("./api");
const { createLogger } = require("../shared/enhanced-logger");

async function startAnalyticsService() {
    const logger = createLogger("analytics-service-server", {
        enableFile: process.env.ENABLE_FILE_LOGGING === "true",
        logLevel: process.env.LOG_LEVEL || "info",
    });

    logger.info("Starting TalentSphere Analytics Service...");

    // Create analytics service instance
    const analyticsService = new AnalyticsService({
        retentionPeriod: process.env.ANALYTICS_RETENTION_DAYS
            ? parseInt(process.env.ANALYTICS_RETENTION_DAYS)
            : 365,
        aggregationInterval: process.env.AGGREGATION_INTERVAL || "hourly",
        enableRealTimeAggregation: process.env.ENABLE_REAL_TIME_AGGREGATION === "true",
        enableExecutiveDashboards: process.env.ENABLE_EXECUTIVE_DASHBOARDS !== "false",
        enableUserEngagementAnalytics: process.env.ENABLE_USER_ENGAGEMENT_ANALYTICS !== "false",
        enableJobPostingAnalytics: process.env.ENABLE_JOB_POSTING_ANALYTICS !== "false",
        enableRevenueAnalytics: process.env.ENABLE_REVENUE_ANALYTICS !== "false",
        enablePerformanceMetrics: process.env.ENABLE_PERFORMANCE_METRICS !== "false",
        enableUserBehaviorTracking: process.env.ENABLE_USER_BEHAVIOR_TRACKING !== "false",
        enableConversionTracking: process.env.ENABLE_CONVERSION_TRACKING !== "false",
    });

    // Create and start API server
    const analyticsAPI = new AnalyticsAPI(analyticsService);
    const apiPort = process.env.ANALYTICS_API_PORT || 3009;
    await analyticsAPI.start(apiPort);

    logger.info("Analytics Service started successfully", {
        api_port: apiPort,
        data_retention_days: analyticsService.options.retentionPeriod,
        real_time_aggregation: analyticsService.options.enableRealTimeAggregation,
        executive_dashboards: analyticsService.options.enableExecutiveDashboards,
        user_engagement_analytics: analyticsService.options.enableUserEngagementAnalytics,
    });

    logger.info("Available API endpoints", {
        endpoints: [
            "GET  /health - Health check",
            "POST /api/v1/analytics/events - Log event",
            "GET  /api/v1/analytics/dashboard/executive - Executive dashboard",
            "GET  /api/v1/analytics/dashboard/user-engagement - User engagement dashboard",
            "GET  /api/v1/analytics/dashboard/job-posting - Job posting dashboard",
            "GET  /api/v1/analytics/dashboard/revenue - Revenue dashboard",
            "GET  /api/v1/analytics/user-engagement - User engagement analytics",
            "GET  /api/v1/analytics/job-posting - Job posting analytics",
            "GET  /api/v1/analytics/revenue - Revenue analytics",
            "GET  /api/v1/analytics/performance - Performance metrics",
            "POST /api/v1/analytics/reports - Generate custom report",
            "GET  /api/v1/analytics/export - Export data",
            "GET  /api/v1/analytics/stats - Analytics statistics",
            "DELETE /api/v1/analytics/data/clean - Clean old data",
            "GET  /api/v1/analytics/realtime - Real-time metrics",
            "GET  /api/v1/analytics/trends - Trend analysis",
        ],
    });

    // Schedule periodic data cleanup
    const cleanupInterval = setInterval(
        () => {
            console.log("Running periodic data cleanup...");
            const cleaned = analyticsService.cleanOldData();
            console.log(`Cleaned data:`, cleaned);
        },
        24 * 60 * 60 * 1000
    ); // Run daily

    // Handle graceful shutdown
    process.on("SIGINT", () => {
        logger.info("Shutting down analytics service...", { signal: "SIGINT" });
        clearInterval(cleanupInterval);
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        logger.info("Shutting down analytics service...", { signal: "SIGTERM" });
        clearInterval(cleanupInterval);
        process.exit(0);
    });
}

// If this file is run directly, start the service
if (require.main === module) {
    startAnalyticsService().catch(error => {
        console.error("Failed to start analytics service:", error);
        process.exit(1);
    });
}

module.exports = {
    AnalyticsService,
    AnalyticsAPI,
    startAnalyticsService,
};
