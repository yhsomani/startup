#!/usr/bin/env node

const LoadTester = require('./load-tester');
const fs = require('fs');
const path = require('path');

/**
 * Stress Testing CLI Tool
 * Command-line interface for running load and stress tests
 */

class StressTestCLI {
    constructor() {
        this.args = process.argv.slice(2);
        this.command = this.args[0];
        this.options = this.parseOptions();
    }

    parseOptions() {
        const options = {};
        let i = 1;

        while (i < this.args.length) {
            const arg = this.args[i];

            if (arg.startsWith('--')) {
                const key = arg.substring(2);
                const value = this.args[i + 1];

                if (value && !value.startsWith('--')) {
                    options[key] = this.parseValue(value);
                    i += 2;
                } else {
                    options[key] = true;
                    i += 1;
                }
            } else {
                i += 1;
            }
        }

        return options;
    }

    parseValue(value) {
        if (value === 'true') {return true;}
        if (value === 'false') {return false;}
        if (!isNaN(value)) {return Number(value);}
        return value;
    }

    async run() {
        try {
            switch (this.command) {
                case 'help':
                case undefined:
                    this.showHelp();
                    break;

                case 'run':
                    await this.runTest();
                    break;

                case 'stress':
                    await this.runStressTest();
                    break;

                case 'analyze':
                    await this.analyzeResults();
                    break;

                default:
                    console.error(`Unknown command: ${this.command}`);
                    this.showHelp();
                    process.exit(1);
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }

    showHelp() {
        console.log(`
Stress Testing CLI Tool
=======================

Usage: node stress-test.js <command> [options]

Commands:
  run      Run a load test
  stress   Run a stress test (increasing load)
  analyze  Analyze test results
  help     Show this help

Options:
  --target <url>          Target URL to test (default: http://localhost:3000)
  --duration <seconds>    Test duration in seconds (default: 60)
  --users <count>         Maximum number of virtual users (default: 100)
  --ramp-up <seconds>     Ramp up time in seconds (default: 10)
  --spawn-rate <rate>     Users spawned per second (default: 10)
  --output-dir <path>     Output directory for results (default: ./results)
  --config <file>         Configuration file path
  --scenario <file>       Test scenario file

Examples:
  node stress-test.js run --target http://localhost:3000 --duration 120 --users 50
  node stress-test.js stress --target https://api.example.com --max-users 200
  node stress-test.js analyze --results ./results/latest.json
    `);
    }

    async runTest() {
        console.log('🎯 Running Load Test...');

        const config = this.getTestConfig();
        const tester = new LoadTester(config);

        // Add default scenarios if none provided
        if (config.testScenarios.length === 0) {
            this.addDefaultScenarios(tester);
        }

        const results = await tester.run();
        console.log('\n✅ Load test completed!');

        return results;
    }

    async runStressTest() {
        console.log('🔥 Running Stress Test...');

        const baseConfig = this.getTestConfig();
        const stressLevels = [
            { users: 10, duration: 30 },
            { users: 25, duration: 30 },
            { users: 50, duration: 30 },
            { users: 100, duration: 60 },
            { users: 150, duration: 60 }
        ];

        const allResults = [];

        for (const level of stressLevels) {
            console.log(`\n🧪 Testing with ${level.users} users for ${level.duration} seconds...`);

            const config = {
                ...baseConfig,
                maxVirtualUsers: level.users,
                duration: level.duration,
                rampUp: Math.min(10, level.duration / 3)
            };

            const tester = new LoadTester(config);
            this.addDefaultScenarios(tester);

            try {
                const results = await tester.run();
                allResults.push({
                    level,
                    results: results.statistics
                });

                // Check if we should continue based on error rate
                if (results.statistics.errorRate > 10) {
                    console.log('⚠️  High error rate detected, stopping stress test');
                    break;
                }

            } catch (error) {
                console.error(`❌ Stress test level failed:`, error.message);
                allResults.push({
                    level,
                    error: error.message
                });
            }

            // Cool down period
            if (level !== stressLevels[stressLevels.length - 1]) {
                console.log('💤 Cooling down for 10 seconds...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        await this.saveStressReport(allResults);
        this.printStressSummary(allResults);
    }

    getTestConfig() {
        let config = {
            target: this.options.target || 'http://localhost:3000',
            duration: parseInt(this.options.duration) || 60,
            maxVirtualUsers: parseInt(this.options.users) || 100,
            rampUp: parseInt(this.options['ramp-up']) || 10,
            spawnRate: parseInt(this.options['spawn-rate']) || 10,
            outputDir: this.options['output-dir'] || './load-test-results',
            testScenarios: []
        };

        // Load configuration from file
        if (this.options.config) {
            const configFile = path.resolve(this.options.config);
            if (fs.existsSync(configFile)) {
                const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                config = { ...config, ...fileConfig };
            }
        }

        // Load scenarios from file
        if (this.options.scenario) {
            const scenarioFile = path.resolve(this.options.scenario);
            if (fs.existsSync(scenarioFile)) {
                const scenarios = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
                config.testScenarios = scenarios;
            }
        }

        return config;
    }

    addDefaultScenarios(tester) {
        // Homepage scenario
        tester.addScenario('homepage', {
            weight: 3,
            steps: [
                {
                    path: '/',
                    method: 'GET',
                    thinkTime: 2000
                },
                {
                    path: '/api/stats',
                    method: 'GET',
                    thinkTime: 1000
                }
            ]
        });

        // Job search scenario
        tester.addScenario('job-search', {
            weight: 2,
            steps: [
                {
                    path: '/api/jobs?limit=20',
                    method: 'GET',
                    thinkTime: 1500
                },
                {
                    path: '/api/jobs/1',
                    method: 'GET',
                    thinkTime: 2000
                }
            ]
        });

        // User profile scenario
        tester.addScenario('user-profile', {
            weight: 1,
            steps: [
                {
                    path: '/api/users/1',
                    method: 'GET',
                    thinkTime: 1000
                },
                {
                    path: '/api/profiles/1',
                    method: 'GET',
                    thinkTime: 1500
                }
            ]
        });
    }

    async analyzeResults() {
        const resultsFile = this.options.results;

        if (!resultsFile) {
            console.error('Please specify results file with --results option');
            return;
        }

        if (!fs.existsSync(resultsFile)) {
            console.error(`Results file not found: ${resultsFile}`);
            return;
        }

        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

        console.log('📊 Test Results Analysis');
        console.log('======================');

        const stats = results.statistics;
        console.log(`\n📈 Summary:`);
        console.log(`  Duration: ${stats.totalDuration.toFixed(2)} seconds`);
        console.log(`  Requests: ${stats.totalRequests} (${stats.successRate}% success)`);
        console.log(`  Throughput: ${stats.throughput?.mean || 'N/A'} req/sec`);

        if (stats.responseTime) {
            console.log(`\n⏱️  Response Times:`);
            console.log(`  Average: ${stats.responseTime.mean}ms`);
            console.log(`  95th Percentile: ${stats.responseTime.p95}ms`);
            console.log(`  99th Percentile: ${stats.responseTime.p99}ms`);
        }

        if (results.recommendations?.length > 0) {
            console.log(`\n💡 Recommendations:`);
            results.recommendations.forEach((rec, i) => {
                console.log(`  ${i + 1}. ${rec.recommendation}`);
            });
        }
    }

    async saveStressReport(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `stress-test-report-${timestamp}.json`;
        const filepath = path.join('./stress-test-results', filename);

        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            testType: 'stress',
            results: results
        };

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`📋 Stress test report saved to: ${filepath}`);
    }

    printStressSummary(results) {
        console.log('\n🔥 Stress Test Summary');
        console.log('=====================');

        results.forEach((result, index) => {
            const level = result.level;
            const stats = result.results;

            console.log(`\nLevel ${index + 1}: ${level.users} users × ${level.duration}s`);

            if (result.error) {
                console.log(`  ❌ Failed: ${result.error}`);
            } else {
                console.log(`  ✅ Success Rate: ${stats.successRate}%`);
                console.log(`  📈 Throughput: ${stats.throughput?.mean || 'N/A'} req/sec`);
                console.log(`  ⏱️  Avg Response: ${stats.responseTime?.mean || 'N/A'}ms`);
            }
        });
    }
}

// Run if executed directly
if (require.main === module) {
    const cli = new StressTestCLI();
    cli.run().catch(console.error);
}

module.exports = StressTestCLI;