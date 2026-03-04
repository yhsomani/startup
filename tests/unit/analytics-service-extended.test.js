/**
 * Additional Unit Tests for Analytics Service
 * Comprehensive coverage for all analytics methods
 */

const AnalyticsService = require('../../services/analytics-service/analytics-service');

describe('AnalyticsService - Extended Coverage', () => {
    let analyticsService;

    beforeEach(() => {
        analyticsService = new AnalyticsService({
            retentionPeriod: 30,
            aggregationInterval: 'daily',
            enableRealTimeAggregation: true
        });
    });

    describe('Event Processing', () => {
        test('should process user_login event', () => {
            analyticsService.logEvent('user_login', { userId: 'user-1' });
            const events = Array.from(analyticsService.events.values());
            expect(events.length).toBeGreaterThan(0);
        });

        test('should process user_registration event', () => {
            analyticsService.logEvent('user_registration', { userId: 'user-1', source: 'google' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process job_view event', () => {
            analyticsService.logEvent('job_view', { jobId: 'job-1', userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process job_apply event', () => {
            analyticsService.logEvent('job_apply', { jobId: 'job-1', userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process job_post event', () => {
            analyticsService.logEvent('job_post', { jobId: 'job-1', companyId: 'company-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process page_view event', () => {
            analyticsService.logEvent('page_view', { userId: 'user-1', page: '/home' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process course_enrollment event', () => {
            analyticsService.logEvent('course_enrollment', { courseId: 'course-1', userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process lesson_completed event', () => {
            analyticsService.logEvent('lesson_completed', { lessonId: 'lesson-1', userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process challenge_completed event', () => {
            analyticsService.logEvent('challenge_completed', { challengeId: 'challenge-1', userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process payment_completed event', () => {
            analyticsService.logEvent('payment_completed', { amount: 99, userId: 'user-1' });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process api_request event', () => {
            analyticsService.logEvent('api_request', { endpoint: '/api/users', responseTime: 150, statusCode: 200 });
            expect(analyticsService.events.size).toBe(1);
        });

        test('should process unknown event type', () => {
            analyticsService.logEvent('unknown_event', { data: 'test' });
            expect(analyticsService.events.size).toBe(1);
        });
    });

    describe('Data Retrieval', () => {
        test('should retrieve logged events from internal storage', () => {
            analyticsService.logEvent('user_login', { userId: 'user-1' });
            analyticsService.logEvent('job_view', { jobId: 'job-1' });
            const events = Array.from(analyticsService.events.values());
            expect(events.length).toBe(2);
        });

        test('should store events with correct eventType', () => {
            analyticsService.logEvent('user_login', { userId: 'user-1' });
            analyticsService.logEvent('user_login', { userId: 'user-2' });
            analyticsService.logEvent('job_view', { jobId: 'job-1' });
            const events = Array.from(analyticsService.events.values());
            const loginEvents = events.filter(e => e.eventType === 'user_login');
            expect(loginEvents.length).toBe(2);
        });

        test('should store events with user data', () => {
            analyticsService.logEvent('user_login', { userId: 'user-1' });
            analyticsService.logEvent('job_view', { userId: 'user-1' });
            const events = Array.from(analyticsService.events.values());
            const userEvents = events.filter(e => e.data?.userId === 'user-1');
            expect(userEvents.length).toBe(2);
        });

        test('should store events with timestamps', () => {
            analyticsService.logEvent('user_login', { userId: 'user-1' });
            analyticsService.logEvent('user_login', { userId: 'user-2' });
            analyticsService.logEvent('job_view', { jobId: 'job-1' });
            const events = Array.from(analyticsService.events.values());
            const eventsWithTimestamp = events.filter(e => e.timestamp);
            expect(eventsWithTimestamp.length).toBe(3);
        });
    });

    describe('Analytics Generation', () => {
        test('should generate user engagement analytics', () => {
            analyticsService.logEvent('page_view', { userId: 'user-1', page: '/home' });
            analyticsService.logEvent('page_view', { userId: 'user-1', page: '/jobs' });
            analyticsService.logEvent('job_apply', { userId: 'user-1', jobId: 'job-1' });
            
            const engagement = analyticsService.getUserEngagementAnalytics({ userId: 'user-1' });
            expect(engagement).toBeDefined();
        });

        test('should generate job posting analytics', () => {
            analyticsService.logEvent('job_view', { jobId: 'job-1', userId: 'user-1' });
            analyticsService.logEvent('job_view', { jobId: 'job-1', userId: 'user-2' });
            analyticsService.logEvent('job_apply', { jobId: 'job-1', userId: 'user-1' });
            
            const jobAnalytics = analyticsService.getJobPostingAnalytics({ jobId: 'job-1' });
            expect(jobAnalytics).toBeDefined();
        });

        test('should generate revenue analytics', () => {
            analyticsService.logEvent('payment_completed', { amount: 100, userId: 'user-1' });
            analyticsService.logEvent('payment_completed', { amount: 200, userId: 'user-2' });
            
            const revenue = analyticsService.getRevenueAnalytics({});
            expect(revenue).toBeDefined();
        });

        test('should generate performance metrics', () => {
            analyticsService.logEvent('api_request', { endpoint: '/api/users', responseTime: 100, statusCode: 200 });
            analyticsService.logEvent('api_request', { endpoint: '/api/users', responseTime: 200, statusCode: 200 });
            
            const metrics = analyticsService.getPerformanceMetrics({ endpoint: '/api/users' });
            expect(metrics).toBeDefined();
        });
    });

    describe('Dashboard Data', () => {
        test('should generate executive dashboard', () => {
            analyticsService.logEvent('user_registration', { userId: 'user-1' });
            analyticsService.logEvent('job_post', { companyId: 'company-1' });
            analyticsService.logEvent('payment_completed', { amount: 5000 });
            
            const dashboard = analyticsService.getExecutiveDashboardData();
            expect(dashboard).toBeDefined();
            expect(dashboard.kpis).toBeDefined();
        });

        test('should calculate trends', () => {
            analyticsService.logEvent('page_view', { userId: 'user-1', page: '/home' });
            analyticsService.logEvent('page_view', { userId: 'user-2', page: '/home' });
            
            const trends = analyticsService.calculateTrends('24h', 'page_view');
            expect(trends).toBeDefined();
            expect(trends.data).toBeDefined();
        });
    });

    describe('Data Aggregation', () => {
        test('should store events for aggregation', () => {
            const service = new AnalyticsService({ aggregationInterval: 'hourly' });
            service.logEvent('user_login', { userId: 'user-1' });
            expect(service.events.size).toBe(1);
        });

        test('should store events with daily aggregation config', () => {
            const service = new AnalyticsService({ aggregationInterval: 'daily' });
            service.logEvent('user_login', { userId: 'user-1' });
            expect(service.events.size).toBe(1);
        });

        test('should store events with weekly aggregation config', () => {
            const service = new AnalyticsService({ aggregationInterval: 'weekly' });
            service.logEvent('user_login', { userId: 'user-1' });
            expect(service.events.size).toBe(1);
        });
    });

    describe('Data Retention', () => {
        test('should store events with retention config', () => {
            const service = new AnalyticsService({ retentionPeriod: 1 });
            service.logEvent('user_login', { userId: 'user-1' });
            expect(service.events.size).toBe(1);
        });

        test('should store recent events within retention period', () => {
            const service = new AnalyticsService({ retentionPeriod: 30 });
            const recentDate = new Date().toISOString();
            service.logEvent('user_login', { userId: 'user-1' }, null, recentDate);
            expect(service.events.size).toBe(1);
        });
    });

    describe('Configuration Options', () => {
        test('should respect enableRealTimeAggregation option', () => {
            const service = new AnalyticsService({ enableRealTimeAggregation: false });
            expect(service.options.enableRealTimeAggregation).toBe(false);
        });

        test('should respect enableExecutiveDashboards option', () => {
            const service = new AnalyticsService({ enableExecutiveDashboards: false });
            expect(service.options.enableExecutiveDashboards).toBe(false);
        });

        test('should respect enableUserEngagementAnalytics option', () => {
            const service = new AnalyticsService({ enableUserEngagementAnalytics: false });
            expect(service.options.enableUserEngagementAnalytics).toBe(false);
        });

        test('should respect enableJobPostingAnalytics option', () => {
            const service = new AnalyticsService({ enableJobPostingAnalytics: false });
            expect(service.options.enableJobPostingAnalytics).toBe(false);
        });

        test('should respect enableRevenueAnalytics option', () => {
            const service = new AnalyticsService({ enableRevenueAnalytics: false });
            expect(service.options.enableRevenueAnalytics).toBe(false);
        });

        test('should respect enablePerformanceMetrics option', () => {
            const service = new AnalyticsService({ enablePerformanceMetrics: false });
            expect(service.options.enablePerformanceMetrics).toBe(false);
        });

        test('should respect enableUserBehaviorTracking option', () => {
            const service = new AnalyticsService({ enableUserBehaviorTracking: false });
            expect(service.options.enableUserBehaviorTracking).toBe(false);
        });

        test('should respect enableConversionTracking option', () => {
            const service = new AnalyticsService({ enableConversionTracking: false });
            expect(service.options.enableConversionTracking).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle event with empty object data', () => {
            const eventId = analyticsService.logEvent('user_login', {});
            expect(eventId).toBeDefined();
        });

        test('should handle event with metadata', () => {
            const eventId = analyticsService.logEvent('user_login', { userId: 'user-1' }, { ip: '127.0.0.1' });
            expect(eventId).toBeDefined();
        });

        test('should handle custom timestamp', () => {
            const customDate = '2024-01-15T10:00:00Z';
            const eventId = analyticsService.logEvent('user_login', { userId: 'user-1' }, null, customDate);
            expect(eventId).toBeDefined();
        });
    });

    describe('Initialization', () => {
        test('should initialize data structures', () => {
            expect(analyticsService.userEngagement).toBeDefined();
            expect(analyticsService.jobAnalytics).toBeDefined();
            expect(analyticsService.revenueData).toBeDefined();
            expect(analyticsService.performanceMetrics).toBeDefined();
            expect(analyticsService.events).toBeDefined();
            expect(analyticsService.aggregatedData).toBeDefined();
        });
    });
});
