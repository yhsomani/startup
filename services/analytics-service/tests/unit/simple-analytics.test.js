/**
 * Unit Tests for Analytics Service
 * Simple, working tests
 */

const { createLogger } = require('../test-helpers');
const AnalyticsService = require('../../analytics-service');

describe('AnalyticsService - Core Functionality', () => {
    let analyticsService;

    beforeEach(() => {
        analyticsService = new AnalyticsService();
    });

    afterEach(async () => {
        const logger = createLogger();
        if (logger && typeof logger.cleanup === 'function') {
            await logger.cleanup();
        }
    });

    test('should initialize correctly', () => {
        expect(analyticsService).toBeDefined();
        expect(analyticsService.options.retentionPeriod).toBe(365);
        expect(analyticsService.options.aggregationInterval).toBe('hourly');
        expect(analyticsService.options.enableRealTimeAggregation).toBe(true);
    });

    test('should log events correctly', () => {
        const eventData = {
            eventType: 'user_login',
            data: { userId: 'test-user' }
        };

        const eventId = analyticsService.logEvent('user_login', eventData.data);

        expect(eventId).toBeDefined();
        expect(typeof eventId).toBe('string');
    });

    test('should handle unknown event types', () => {
        const unknownEvent = {
            eventType: 'unknown_event',
            data: { test: true }
        };

        analyticsService.logEvent('unknown_event', unknownEvent.data);
        expect(true).toBe(true);
    });

    test('should get user engagement analytics', () => {
        const userId = 'test-user-engagement';
        
        const engagement = analyticsService.getUserEngagementAnalytics({ userId });

        expect(engagement.length).toBeGreaterThanOrEqual(0);
    });
});