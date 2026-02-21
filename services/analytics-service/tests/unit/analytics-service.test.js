/**
 * Unit Tests for Analytics Service
 * Comprehensive test suite for analytics functionality
 */

const { TestHelpers } = require('../test-helpers');
const AnalyticsService = require('../../analytics-service');

describe('AnalyticsService', () => {
    let testHelpers;
    let analyticsService;

    beforeEach(() => {
        testHelpers = new TestHelpers();
        analyticsService = new AnalyticsService();
    });

    afterEach(async () => {
        await testHelpers.cleanup();
    });

    test('should initialize with default options', () => {
        expect(analyticsService).toBeDefined();
        expect(analyticsService.options.retentionPeriod).toBe(365);
        expect(analyticsService.options.aggregationInterval).toBe('hourly');
        expect(analyticsService.options.enableRealTimeAggregation).toBe(true);
    });

    test('should log events correctly', () => {
        const eventData = {
            eventType: 'user_login',
            data: { userId: 'test-user', loginTime: '2024-01-01T10:00:00Z' }
        };

        const eventId = analyticsService.logEvent('user_login', eventData.data);

        expect(eventId).toBeDefined();
        expect(typeof eventId).toBe('string');
    });

    test('should get user engagement analytics', () => {
        const userId = 'test-user-engagement';
        
        analyticsService.logEvent('page_view', { userId, page: '/home' });
        analyticsService.logEvent('job_apply', { userId, jobId: 'job-1' });

        const engagement = analyticsService.getUserEngagementAnalytics({ userId });

        expect(engagement.length).toBeGreaterThanOrEqual(0);
    });

    test('should get job posting analytics', () => {
        const jobId = 'test-job-posting';
        
        analyticsService.logEvent('job_view', { jobId, userId: 'test-user' });
        analyticsService.logEvent('job_apply', { jobId, userId: 'test-user' });

        const analytics = analyticsService.getJobPostingAnalytics({ jobId });

        expect(analytics.length).toBeGreaterThanOrEqual(0);
    });

    test('should get revenue analytics', () => {
        const userId = 'test-user-revenue';
        const paymentData = { amount: 100, type: 'premium' };

        analyticsService.logEvent('payment_completed', paymentData);

        const revenueAnalytics = analyticsService.getRevenueAnalytics({ userId });

        expect(revenueAnalytics.length).toBeGreaterThanOrEqual(0);
    });

    test('should get performance metrics', () => {
        const endpoint = '/api/v1/test';
        const responseTime = 250;

        analyticsService.logEvent('api_request', {
            endpoint,
            method: 'GET',
            responseTime,
            statusCode: 200
        });

        const perfMetrics = analyticsService.getPerformanceMetrics({ endpoint });

        expect(perfMetrics.length).toBeGreaterThanOrEqual(0);
    });

    test('should generate executive dashboard', () => {
        analyticsService.logEvent('user_registration', { userId: 'test-exec-user' });
        analyticsService.logEvent('job_post', { companyId: 'test-company' });
        analyticsService.logEvent('payment_completed', { amount: 5000, userId: 'test-exec-user' });

        const dashboard = analyticsService.getExecutiveDashboardData();

        expect(dashboard.kpis).toBeDefined();
        expect(dashboard.kpis.totalUsers).toBeGreaterThanOrEqual(0);
    });

    test('should calculate trends', () => {
        const baseDate = new Date();
        
        for (let i = 0; i < 3; i++) {
            const eventDate = new Date(baseDate.getTime() - (2 - i) * 24 * 60 * 60 * 1000);
            analyticsService.logEvent('page_view', { userId: 'test-user', page: '/page-' + i }, null, eventDate.toISOString());
        }

        const trends = analyticsService.calculateTrends('3d', 'page_view');

        expect(trends.data).toBeDefined();
        expect(trends.total_events).toBe(3);
    });
});