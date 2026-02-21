/**
 * Simple Integration Tests for Analytics Service
 * End-to-end testing without ES module complications
 */

const AnalyticsService = require('../../analytics-service');

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}));

// Mock moment to simplify testing
jest.mock('moment', () => {
    const mockMoment = (date) => ({
        isBefore: jest.fn(() => false),
        isAfter: jest.fn(() => true),
        isBetween: jest.fn(() => true),
        format: jest.fn(() => date ? date : '2024-01-01T00:00:00Z'),
        toDate: jest.fn(() => new Date()),
        valueOf: jest.fn(() => Date.now()),
        clone: jest.fn(() => mockMoment(date)),
        subtract: jest.fn(() => mockMoment(date))
    });
    mockMoment.utc = jest.fn(() => mockMoment());
    return mockMoment;
});

describe('Analytics Service Integration Tests', () => {
    let analyticsService;

    beforeEach(() => {
        analyticsService = new AnalyticsService({
            retentionPeriod: 365,
            aggregationInterval: 'hourly',
            enableRealTimeAggregation: true
        });
    });

    afterEach(() => {
        // Clean up service state
        if (typeof analyticsService.cleanOldData === 'function') {
            analyticsService.cleanOldData();
        }
        // Reset data structures
        analyticsService.events.clear();
        analyticsService.userEngagement.clear();
        analyticsService.jobAnalytics.clear();
        analyticsService.revenueData.clear();
    });

    describe('Complete User Journey Integration', () => {
        test('should track complete job application flow', () => {
            const userId = 'integration-user-journey';
            const jobId = 'integration-job-1';
            const companyId = 'integration-company-1';

            // 1. User registers
            const registrationEvent = analyticsService.logEvent('user_registration', {
                userId,
                email: 'test@example.com',
                source: 'organic'
            });

            expect(registrationEvent).toBeDefined();
            expect(typeof registrationEvent).toBe('string');

            // 2. User searches for jobs
            const searchEvent = analyticsService.logEvent('search_performed', {
                userId,
                query: 'software engineer',
                resultsCount: 25
            });

            expect(searchEvent).toBeDefined();

            // 3. User views job posting
            const jobViewEvent = analyticsService.logEvent('job_view', {
                userId,
                jobId,
                companyId,
                page: `/jobs/${jobId}`
            });

            expect(jobViewEvent).toBeDefined();

            // 4. User applies for job
            const jobApplyEvent = analyticsService.logEvent('job_apply', {
                userId,
                jobId,
                companyId,
                resumeId: 'resume-123',
                coverLetter: true
            });

            expect(jobApplyEvent).toBeDefined();

            // 5. Verify all data is tracked correctly
            const userAnalytics = analyticsService.getUserEngagementAnalytics({ userId });
            expect(userAnalytics).toBeDefined();

            const jobAnalytics = analyticsService.getJobPostingAnalytics({ jobId });
            expect(jobAnalytics).toBeDefined();

            // Verify the complete flow is captured
            expect(analyticsService.events.size).toBeGreaterThanOrEqual(4);
        });

        test('should track revenue and engagement correlation', () => {
            const userId = 'revenue-test-user';
            const jobId = 'premium-job-1';

            // Free user behavior
            analyticsService.logEvent('user_registration', { userId, source: 'organic' });
            analyticsService.logEvent('job_view', { userId, jobId });
            analyticsService.logEvent('job_apply', { userId, jobId });

            // User upgrades to premium
            analyticsService.logEvent('payment_completed', {
                userId,
                amount: 99.99,
                type: 'premium',
                currency: 'USD'
            });

            // Premium user behavior
            analyticsService.logEvent('job_view', { userId, jobId: 'premium-job-2' });
            analyticsService.logEvent('message_sent', {
                userId,
                recipientId: 'recruiter-1',
                messageId: 'msg-123'
            });

            // Verify revenue analytics
            const revenueAnalytics = analyticsService.getRevenueAnalytics({ userId });
            expect(revenueAnalytics).toBeDefined();

            // Verify engagement metrics
            const engagementAnalytics = analyticsService.getUserEngagementAnalytics({ userId });
            expect(engagementAnalytics).toBeDefined();

            // Verify payment was tracked
            const allEvents = Array.from(analyticsService.events.values());
            const paymentEvents = allEvents.filter(e => e.eventType === 'payment_completed');
            expect(paymentEvents).toHaveLength(1);
            expect(paymentEvents[0].data.amount).toBe(99.99);
        });

        test('should handle batch event processing', () => {
            const events = [];
            const userId = 'batch-test-user';

            // Generate batch of events
            for (let i = 0; i < 100; i++) {
                events.push({
                    eventType: 'page_view',
                    data: {
                        userId,
                        page: `/page-${i}`,
                        sessionId: 'session-123'
                    }
                });
            }

            // Process all events
            const eventIds = events.map(event => 
                analyticsService.logEvent(event.eventType, event.data)
            );

            // Verify all events were processed
            expect(eventIds).toHaveLength(100);
            eventIds.forEach(id => {
                expect(id).toBeDefined();
                expect(typeof id).toBe('string');
            });

            // Verify analytics data
            const analytics = analyticsService.getUserEngagementAnalytics({ userId });
            expect(analytics).toBeDefined();

            // Verify trends calculation works
            const trends = analyticsService.calculateTrends('7d', 'page_view');
            expect(trends).toBeDefined();
            expect(trends.total_events).toBeGreaterThanOrEqual(100);
        });
    });

    describe('Real-time Analytics Integration', () => {
        test('should calculate trends in real-time', () => {
            const baseTime = new Date();
            
            // Create events over the last 3 days
            const dailyEvents = [5, 8, 12]; // Events per day
            const totalEvents = dailyEvents.reduce((sum, count) => sum + count, 0);

            dailyEvents.forEach((count, dayIndex) => {
                for (let i = 0; i < count; i++) {
                    const eventDate = new Date(baseTime.getTime() - (2 - dayIndex) * 24 * 60 * 60 * 1000);
                    analyticsService.logEvent('page_view', {
                        userId: `user-${dayIndex}-${i}`,
                        page: `/page-${i}`
                    }, eventDate.toISOString());
                }
            });

            // Test 3-day trends
            const trends3d = analyticsService.calculateTrends('3d', 'page_view');
            expect(trends3d.total_events).toBe(totalEvents);
            expect(trends3d.time_range).toBe('3d');
            expect(trends3d.event_type).toBe('page_view');

            // Test 7-day trends (should include same events)
            const trends7d = analyticsService.calculateTrends('7d', 'page_view');
            expect(trends7d.total_events).toBe(totalEvents);
            expect(trends7d.time_range).toBe('7d');
        });

        test('should generate executive dashboard data', () => {
            // Simulate platform activity
            analyticsService.logEvent('user_registration', { userId: 'user-1', source: 'google' });
            analyticsService.logEvent('user_registration', { userId: 'user-2', source: 'linkedin' });
            analyticsService.logEvent('job_post', { companyId: 'company-1', plan: 'premium' });
            analyticsService.logEvent('job_post', { companyId: 'company-2', plan: 'basic' });
            analyticsService.logEvent('payment_completed', { userId: 'user-3', amount: 299.99, type: 'enterprise' });

            const dashboard = analyticsService.getExecutiveDashboardData();
            
            expect(dashboard).toBeDefined();
            expect(dashboard.kpis).toBeDefined();
            expect(dashboard.kpis.totalUsers).toBeGreaterThanOrEqual(2);
            expect(dashboard.kpis.totalJobsPosted).toBeGreaterThanOrEqual(1);
            expect(dashboard.kpis.totalRevenue).toBeGreaterThanOrEqual(299.99);
            if (dashboard.kpis.totalRevenue !== undefined) {
                expect(dashboard.kpis.totalRevenue).toBeGreaterThanOrEqual(299.99);
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle concurrent event processing', async () => {
            const userId = 'concurrent-test-user';
            const promises = [];

            // Create 50 concurrent events
            for (let i = 0; i < 50; i++) {
                promises.push(
                    new Promise(resolve => {
                        const eventId = analyticsService.logEvent('page_view', {
                            userId,
                            page: `/concurrent-${i}`
                        });
                        resolve(eventId);
                    })
                );
            }

            const results = await Promise.all(promises);

            // Verify all events were processed
            expect(results).toHaveLength(50);
            results.forEach(eventId => {
                expect(eventId).toBeDefined();
                expect(typeof eventId).toBe('string');
            });

            // Verify data integrity
            const analytics = analyticsService.getUserEngagementAnalytics({ userId });
            expect(analytics).toBeDefined();
        });

        test('should handle invalid event data gracefully', () => {
            // Test with missing required fields
            const result1 = analyticsService.logEvent('', { invalid: 'data' });
            expect(result1).toBeDefined();

            // Test with null data
            const result2 = analyticsService.logEvent('test_event', null);
            expect(result2).toBeDefined();

            // Test with undefined data
            const result3 = analyticsService.logEvent('test_event', undefined);
            expect(result3).toBeDefined();

            // Service should still be functional
            const result4 = analyticsService.logEvent('valid_event', { userId: 'test', action: 'test' });
            expect(result4).toBeDefined();
        });

        test('should handle cleanup and data retention', () => {
            const userId = 'cleanup-test-user';
            
            // Create events
            analyticsService.logEvent('user_registration', { userId });
            analyticsService.logEvent('job_view', { userId, jobId: 'job-1' });

            // Verify events exist
            expect(analyticsService.events.size).toBeGreaterThan(0);

            // Run cleanup (should not remove recent events)
            const cleaned = analyticsService.cleanOldData();
            expect(cleaned).toBeDefined();

            // Service should still be functional
            const result = analyticsService.logEvent('search_performed', { userId, query: 'test' });
            expect(result).toBeDefined();
        });
    });
});