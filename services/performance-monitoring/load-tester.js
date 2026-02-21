const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/**
 * Load Testing Framework
 * Comprehensive load and stress testing for web applications
 */
class LoadTester {
    constructor(options = {}) {
        this.options = {
            target: options.target || 'http://localhost:3000',
            duration: options.duration || 60, // seconds
            rampUp: options.rampUp || 10, // seconds
            maxVirtualUsers: options.maxVirtualUsers || 100,
            spawnRate: options.spawnRate || 10, // users per second
            testScenarios: options.testScenarios || [],
            outputDir: options.outputDir || './load-test-results',
            ...options
        };

        this.results = {
            startTime: null,
            endTime: null,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            throughput: [],
            errors: [],
            virtualUsers: []
        };

        this.running = false;
        this.virtualUsers = [];
        this.metricsInterval = null;
    }

    // Define test scenarios
    addScenario(name, config) {
        this.options.testScenarios.push({
            name,
            weight: config.weight || 1,
            steps: config.steps || [],
            ...config
        });
    }

    // HTTP request helper
    async makeRequest(options) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const lib = options.protocol === 'https:' ? https : http;

            const req = lib.request(options, (res) => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    const duration = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        duration,
                        timestamp: startTime
                    });
                });
            });

            req.on('error', (error) => {
                const duration = Date.now() - startTime;
                reject({
                    error: error.message,
                    duration,
                    timestamp: startTime
                });
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

    // Virtual user simulation
    async runVirtualUser(scenario) {
        const virtualUser = {
            id: Math.random().toString(36).substr(2, 9),
            startTime: Date.now(),
            requests: 0,
            successes: 0,
            failures: 0
        };

        this.virtualUsers.push(virtualUser);

        try {
            for (const step of scenario.steps) {
                if (!this.running) {break;}

                const requestOptions = {
                    hostname: new URL(this.options.target).hostname,
                    port: new URL(this.options.target).port || (new URL(this.options.target).protocol === 'https:' ? 443 : 80),
                    path: step.path,
                    method: step.method || 'GET',
                    headers: step.headers || {},
                    protocol: new URL(this.options.target).protocol
                };

                if (step.body) {
                    requestOptions.body = JSON.stringify(step.body);
                    requestOptions.headers['Content-Type'] = 'application/json';
                    requestOptions.headers['Content-Length'] = Buffer.byteLength(requestOptions.body);
                }

                try {
                    const response = await this.makeRequest(requestOptions);

                    virtualUser.requests++;
                    this.results.totalRequests++;

                    if (response.statusCode >= 200 && response.statusCode < 400) {
                        virtualUser.successes++;
                        this.results.successfulRequests++;
                    } else {
                        virtualUser.failures++;
                        this.results.failedRequests++;
                        this.results.errors.push({
                            type: 'HTTP_ERROR',
                            statusCode: response.statusCode,
                            timestamp: response.timestamp
                        });
                    }

                    this.results.responseTimes.push(response.duration);

                    // Think time between requests
                    if (step.thinkTime) {
                        await new Promise(resolve => setTimeout(resolve, step.thinkTime));
                    }

                } catch (error) {
                    virtualUser.failures++;
                    this.results.failedRequests++;
                    this.results.errors.push({
                        type: 'REQUEST_ERROR',
                        message: error.error,
                        timestamp: error.timestamp
                    });
                }
            }
        } finally {
            virtualUser.endTime = Date.now();
            virtualUser.duration = virtualUser.endTime - virtualUser.startTime;
        }
    }

    // Ramp up virtual users
    async rampUpUsers() {
        const spawnInterval = Math.floor((this.options.rampUp * 1000) / this.options.maxVirtualUsers);

        for (let i = 0; i < this.options.maxVirtualUsers && this.running; i++) {
            // Select scenario based on weights
            const scenario = this.selectWeightedScenario();

            if (scenario) {
                this.runVirtualUser(scenario).catch(console.error);
            }

            await new Promise(resolve => setTimeout(resolve, spawnInterval));
        }
    }

    // Select scenario based on weights
    selectWeightedScenario() {
        if (this.options.testScenarios.length === 0) {return null;}

        const totalWeight = this.options.testScenarios.reduce((sum, scenario) => sum + (scenario.weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const scenario of this.options.testScenarios) {
            random -= scenario.weight || 1;
            if (random <= 0) {
                return scenario;
            }
        }

        return this.options.testScenarios[0];
    }

    // Collect metrics periodically
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            const currentTime = Date.now();
            const elapsedSeconds = Math.floor((currentTime - this.results.startTime) / 1000);

            const throughput = {
                timestamp: currentTime,
                elapsedSeconds,
                requestsPerSecond: this.results.totalRequests / elapsedSeconds
            };

            this.results.throughput.push(throughput);

        }, 1000);
    }

    // Calculate statistics
    calculateStatistics() {
        const stats = {
            totalDuration: (this.results.endTime - this.results.startTime) / 1000,
            totalRequests: this.results.totalRequests,
            successfulRequests: this.results.successfulRequests,
            failedRequests: this.results.failedRequests,
            successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2),
            errorRate: (this.results.failedRequests / this.results.totalRequests * 100).toFixed(2)
        };

        // Response time statistics
        if (this.results.responseTimes.length > 0) {
            const sortedTimes = [...this.results.responseTimes].sort((a, b) => a - b);

            stats.responseTime = {
                min: Math.min(...sortedTimes),
                max: Math.max(...sortedTimes),
                mean: (sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length).toFixed(2),
                median: sortedTimes[Math.floor(sortedTimes.length / 2)],
                p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
                p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
            };
        }

        // Throughput statistics
        if (this.results.throughput.length > 0) {
            const throughputs = this.results.throughput.map(t => t.requestsPerSecond);
            stats.throughput = {
                min: Math.min(...throughputs),
                max: Math.max(...throughputs),
                mean: (throughputs.reduce((a, b) => a + b, 0) / throughputs.length).toFixed(2),
                current: throughputs[throughputs.length - 1]
            };
        }

        return stats;
    }

    // Run the load test
    async run() {
        console.log('🚀 Starting load test...');
        console.log(`Target: ${this.options.target}`);
        console.log(`Duration: ${this.options.duration} seconds`);
        console.log(`Virtual Users: ${this.options.maxVirtualUsers}`);

        this.running = true;
        this.results.startTime = Date.now();

        // Ensure output directory exists
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }

        try {
            // Start metrics collection
            this.startMetricsCollection();

            // Start ramping up users
            const rampUpPromise = this.rampUpUsers();

            // Wait for test duration
            await new Promise(resolve => {
                setTimeout(() => {
                    this.running = false;
                    resolve();
                }, this.options.duration * 1000);
            });

            // Wait for all virtual users to complete
            await rampUpPromise;
            await Promise.all(this.virtualUsers.map(vu => vu.promise || Promise.resolve()));

        } finally {
            this.running = false;
            this.results.endTime = Date.now();

            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
            }
        }

        // Generate results
        const statistics = this.calculateStatistics();
        const report = this.generateReport(statistics);

        await this.saveReport(report);
        this.printSummary(statistics);

        return report;
    }

    // Generate detailed report
    generateReport(statistics) {
        return {
            testConfig: this.options,
            timestamps: {
                start: this.results.startTime,
                end: this.results.endTime
            },
            statistics,
            rawResults: this.results,
            recommendations: this.generateRecommendations(statistics)
        };
    }

    // Generate recommendations based on results
    generateRecommendations(stats) {
        const recommendations = [];

        if (stats.errorRate > 5) {
            recommendations.push({
                priority: 'high',
                issue: 'High error rate detected',
                recommendation: 'Investigate server-side errors and improve error handling'
            });
        }

        if (stats.responseTime && stats.responseTime.p95 > 2000) {
            recommendations.push({
                priority: 'medium',
                issue: 'Slow response times',
                recommendation: 'Optimize database queries and implement caching'
            });
        }

        if (stats.throughput && stats.throughput.mean < 10) {
            recommendations.push({
                priority: 'medium',
                issue: 'Low throughput',
                recommendation: 'Scale horizontally or optimize application performance'
            });
        }

        return recommendations;
    }

    // Save report to file
    async saveReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `load-test-report-${timestamp}.json`;
        const filepath = path.join(this.options.outputDir, filename);

        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`📋 Report saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            console.error('Failed to save report:', error);
            return null;
        }
    }

    // Print summary to console
    printSummary(stats) {
        console.log('\n📊 Load Test Results Summary:');
        console.log(`Duration: ${stats.totalDuration.toFixed(2)} seconds`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Successful: ${stats.successfulRequests} (${stats.successRate}%)`);
        console.log(`Failed: ${stats.failedRequests} (${stats.errorRate}%)`);

        if (stats.responseTime) {
            console.log('\n⏱️  Response Times:');
            console.log(`  Min: ${stats.responseTime.min}ms`);
            console.log(`  Mean: ${stats.responseTime.mean}ms`);
            console.log(`  Median: ${stats.responseTime.median}ms`);
            console.log(`  95th Percentile: ${stats.responseTime.p95}ms`);
            console.log(`  99th Percentile: ${stats.responseTime.p99}ms`);
        }

        if (stats.throughput) {
            console.log('\n📈 Throughput:');
            console.log(`  Min: ${stats.throughput.min.toFixed(2)} req/sec`);
            console.log(`  Mean: ${stats.throughput.mean} req/sec`);
            console.log(`  Max: ${stats.throughput.max.toFixed(2)} req/sec`);
            console.log(`  Current: ${stats.throughput.current.toFixed(2)} req/sec`);
        }

        if (stats.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            stats.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
                console.log(`   ${rec.recommendation}`);
            });
        }
    }

    // Stop the test
    stop() {
        this.running = false;
        console.log('🛑 Stopping load test...');
    }
}

module.exports = LoadTester;