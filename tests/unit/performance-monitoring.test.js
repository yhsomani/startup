/**
 * Unit Tests for Performance Monitoring Service
 * Comprehensive test suite for APM and performance monitoring
 */

const PerformanceMonitoringService = require('../../services/performance-monitoring/performance-monitoring-service');

describe('PerformanceMonitoringService', () => {
    let pmService;

    beforeEach(() => {
        pmService = new PerformanceMonitoringService({
            samplingRate: 100,
            enableAPM: true
        });
    });

    afterEach(() => {
        if (pmService) {
            pmService.shutdown();
        }
    });

    describe('Constructor', () => {
        test('should create monitoring service with default options', () => {
            const service = new PerformanceMonitoringService();
            expect(service).toBeDefined();
            expect(service.options.samplingRate).toBe(100);
        });

        test('should create with custom options', () => {
            const service = new PerformanceMonitoringService({ samplingRate: 50 });
            expect(service.options.samplingRate).toBe(50);
        });
    });

    describe('Metrics Collection', () => {
        test('should track request', () => {
            pmService.trackRequest('/api/users', 'GET', 200, 150);
            expect(pmService.metrics.size).toBeGreaterThan(0);
        });

        test('should track database query', () => {
            pmService.trackDatabaseQuery('SELECT', 'users', 50);
            expect(pmService.metrics.size).toBeGreaterThan(0);
        });

        test('should track external service call', () => {
            pmService.trackExternalServiceCall('stripe', 'payment', 300);
            expect(pmService.metrics.size).toBeGreaterThan(0);
        });

        test('should track memory usage', () => {
            const memory = pmService.trackMemoryUsage();
            expect(memory).toBeDefined();
            expect(memory.heapUsed).toBeDefined();
        });

        test('should track CPU usage', () => {
            const cpu = pmService.trackCPUUsage();
            expect(cpu).toBeDefined();
        });
    });

    describe('Alerting', () => {
        test('should check latency threshold', () => {
            pmService.options.latencyThreshold = 1000;
            const alerts = pmService.checkLatencyThreshold();
            expect(alerts).toBeDefined();
        });

        test('should check error rate', () => {
            pmService.trackRequest('/api/test', 'GET', 500, 100);
            const alerts = pmService.checkErrorRateThreshold();
            expect(alerts).toBeDefined();
        });

        test('should set up alerts', () => {
            pmService.setupAlerts({ latency: 1000, errorRate: 5 });
            expect(pmService.alertThresholds).toBeDefined();
        });
    });

    describe('Reporting', () => {
        test('should generate performance report', () => {
            pmService.trackRequest('/api/test', 'GET', 200, 100);
            const report = pmService.generatePerformanceReport();
            expect(report).toBeDefined();
        });

        test('should get metrics summary', () => {
            pmService.trackRequest('/api/test', 'GET', 200, 100);
            const summary = pmService.getMetricsSummary();
            expect(summary).toBeDefined();
        });

        test('should export metrics', () => {
            const exported = pmService.exportMetrics();
            expect(exported).toBeDefined();
        });
    });

    describe('Service Status', () => {
        test('should have getStatus method', () => {
            expect(typeof pmService.getStatus).toBe('function');
        });

        test('should return status', () => {
            const status = pmService.getStatus();
            expect(status).toBeDefined();
            expect(status.active).toBe(true);
        });

        test('should have shutdown method', () => {
            expect(typeof pmService.shutdown).toBe('function');
        });
    });
});

describe('Connection Pool', () => {
    let pool;

    beforeEach(() => {
        jest.resetModules();
        jest.mock('pg', () => {
            return jest.fn().mockImplementation(() => ({
                Pool: jest.fn().mockImplementation(() => ({
                    connect: jest.fn().mockResolvedValue({ query: jest.fn() }),
                    query: jest.fn().mockResolvedValue({ rows: [] }),
                    end: jest.fn()
                }))
            }));
        });
        pool = require('../../services/performance-monitoring/connection-pool');
    });

    test('should export connection pool', () => {
        expect(pool).toBeDefined();
    });
});

describe('Cache Warmer', () => {
    let cacheWarmer;

    beforeEach(() => {
        jest.resetModules();
        cacheWarmer = require('../../services/performance-monitoring/cache-warmer');
    });

    test('should export cache warmer', () => {
        expect(cacheWarmer).toBeDefined();
    });
});

describe('Bundle Analyzer', () => {
    let bundleAnalyzer;

    beforeEach(() => {
        jest.resetModules();
        bundleAnalyzer = require('../../services/performance-monitoring/bundle-analyzer');
    });

    test('should export bundle analyzer', () => {
        expect(bundleAnalyzer).toBeDefined();
    });
});
