/**
 * Frontend Performance Monitoring
 * Monitors and reports on frontend performance metrics
 */
class FrontendPerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            sampleRate: options.sampleRate || 1.0, // 0.0 to 1.0
            enableWebVitals: options.enableWebVitals !== false,
            enableResourceTiming: options.enableResourceTiming !== false,
            enableLongTasks: options.enableLongTasks !== false,
            reportingEndpoint: options.reportingEndpoint || '/api/performance/frontend',
            ...options
        };

        this.metrics = {
            navigation: {},
            webVitals: {},
            resources: [],
            longTasks: [],
            customMetrics: {}
        };

        this.init();
    }

    init() {
        if (Math.random() > this.options.sampleRate) {
            return; // Skip monitoring based on sample rate
        }

        this.setupNavigationTiming();

        if (this.options.enableWebVitals) {
            this.setupWebVitals();
        }

        if (this.options.enableResourceTiming) {
            this.setupResourceTiming();
        }

        if (this.options.enableLongTasks) {
            this.setupLongTaskObserver();
        }

        this.setupPageLifecycle();
    }

    setupNavigationTiming() {
        if ('navigation' in performance) {
            const nav = performance.navigation;
            const timing = performance.timing;

            this.metrics.navigation = {
                type: nav.type === 0 ? 'navigate' : nav.type === 1 ? 'reload' : 'back_forward',
                redirectCount: nav.redirectCount,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadEvent: timing.loadEventEnd - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                responseTime: timing.responseEnd - timing.requestStart
            };
        }
    }

    setupWebVitals() {
        // Core Web Vitals
        this.measureCLS(); // Cumulative Layout Shift
        this.measureFCP(); // First Contentful Paint
        this.measureFID(); // First Input Delay
        this.measureLCP(); // Largest Contentful Paint
        this.measureTTFB(); // Time to First Byte
    }

    measureCLS() {
        let clsValue = 0;
        let clsEntries = [];

        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push(entry);
                }
            }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Report CLS when page is hidden or unloaded
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                observer.takeRecords();
                this.metrics.webVitals.cls = clsValue;
            }
        });
    }

    measureFCP() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntriesByName('first-contentful-paint');
            if (entries.length > 0) {
                this.metrics.webVitals.fcp = entries[0].startTime;
            }
        });

        observer.observe({ entryTypes: ['paint'] });
    }

    measureFID() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            for (const entry of entries) {
                if (entry.name === 'first-input') {
                    this.metrics.webVitals.fid = entry.processingStart - entry.startTime;
                }
            }
        });

        observer.observe({ entryTypes: ['first-input'] });
    }

    measureLCP() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.webVitals.lcp = lastEntry.startTime;
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    measureTTFB() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.webVitals.ttfb = navigation.responseStart - navigation.requestStart;
        }
    }

    setupResourceTiming() {
        // Monitor resource loading performance
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();

            entries.forEach(entry => {
                if (entry.initiatorType !== 'xmlhttprequest' && entry.initiatorType !== 'fetch') {
                    this.metrics.resources.push({
                        name: entry.name,
                        type: entry.initiatorType,
                        duration: entry.duration,
                        transferSize: entry.transferSize,
                        decodedBodySize: entry.decodedBodySize,
                        startTime: entry.startTime
                    });
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    setupLongTaskObserver() {
        if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
            const observer = new PerformanceObserver((entryList) => {
                entryList.getEntries().forEach(entry => {
                    this.metrics.longTasks.push({
                        startTime: entry.startTime,
                        duration: entry.duration,
                        attribution: entry.attribution
                    });
                });
            });

            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    setupPageLifecycle() {
        // Monitor page lifecycle events
        document.addEventListener('DOMContentLoaded', () => {
            this.mark('domContentLoaded');
        });

        window.addEventListener('load', () => {
            this.mark('windowLoaded');
            // Send initial performance data after page load
            setTimeout(() => this.reportMetrics(), 2000);
        });

        // Report beforeunload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics();
        });

        // Report when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.reportMetrics();
            }
        });
    }

    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    }

    measure(name, startMark, endMark) {
        if (performance.measure) {
            performance.measure(name, startMark, endMark);
        }
    }

    setCustomMetric(name, value) {
        this.metrics.customMetrics[name] = value;
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    async reportMetrics() {
        try {
            const metrics = this.getMetrics();

            // Send to backend
            await fetch(this.options.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metrics)
            });

            // Clear reported metrics
            this.metrics.resources = [];
            this.metrics.longTasks = [];

        } catch (error) {
            console.error('Failed to report frontend metrics:', error);
        }
    }

    // Utility methods for measuring custom performance
    static measureFunction(fn, name) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();

        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    static async measureAsyncFunction(asyncFn, name) {
        const start = performance.now();
        const result = await asyncFn();
        const end = performance.now();

        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Get performance recommendations based on collected metrics
    getRecommendations() {
        const recommendations = [];
        const vitals = this.metrics.webVitals;

        // FCP recommendations
        if (vitals.fcp > 1800) {
            recommendations.push({
                metric: 'FCP',
                issue: 'First Contentful Paint is slow',
                recommendation: 'Optimize server response time and reduce render-blocking resources'
            });
        }

        // LCP recommendations
        if (vitals.lcp > 2500) {
            recommendations.push({
                metric: 'LCP',
                issue: 'Largest Contentful Paint is slow',
                recommendation: 'Optimize largest content element and improve loading performance'
            });
        }

        // FID recommendations
        if (vitals.fid > 100) {
            recommendations.push({
                metric: 'FID',
                issue: 'First Input Delay is high',
                recommendation: 'Reduce JavaScript execution time and optimize main thread work'
            });
        }

        // CLS recommendations
        if (vitals.cls > 0.1) {
            recommendations.push({
                metric: 'CLS',
                issue: 'Cumulative Layout Shift is high',
                recommendation: 'Reserve space for dynamic content and avoid late-loading resources'
            });
        }

        // Resource recommendations
        const largeResources = this.metrics.resources.filter(r => r.transferSize > 100000); // 100KB
        if (largeResources.length > 5) {
            recommendations.push({
                metric: 'Resources',
                issue: 'Too many large resources',
                recommendation: 'Optimize and compress large assets, implement lazy loading'
            });
        }

        return recommendations;
    }
}

// Export for use in applications
if (typeof window !== 'undefined') {
    window.FrontendPerformanceMonitor = FrontendPerformanceMonitor;
}

module.exports = FrontendPerformanceMonitor;