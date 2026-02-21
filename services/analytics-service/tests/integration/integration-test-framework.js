/**
 * Integration Test Framework for TalentSphere
 * Comprehensive testing infrastructure for end-to-end scenarios
 */

const { TestHelpers } = require('../test-helpers');
const { spawn } = require('child_process');
const http = require('http');
const { createLogger } = require('../../../shared/logger');

class IntegrationTestFramework {
    constructor(options = {}) {
        this.options = {
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            parallel: options.parallel || false,
            ...options
        };
        
        this.testHelpers = new TestHelpers();
        this.logger = createLogger('integration-test-framework', { 
            logLevel: process.env.TEST_LOG_LEVEL || 'info' 
        });
        
        this.services = new Map();
        this.httpServers = new Map();
        this.testData = new Map();
    }

    /**
     * Start a service for integration testing
     */
    async startService(serviceName, servicePath, port = null) {
        return new Promise((resolve, reject) => {
            this.logger.info(`Starting service: ${serviceName}`);
            
            const service = spawn('node', [servicePath], {
                stdio: 'pipe',
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    PORT: port?.toString() || '0'
                }
            });

            service.on('error', (error) => {
                this.logger.error(`Failed to start service ${serviceName}:`, error);
                reject(error);
            });

            // Capture output for debugging
            service.stdout.on('data', (data) => {
                this.logger.debug(`[${serviceName}] ${data.toString()}`);
            });

            service.stderr.on('data', (data) => {
                this.logger.warn(`[${serviceName}] ${data.toString()}`);
            });

            // Wait for service to be ready
            const checkReady = () => {
                if (port && this.isPortAvailable(port)) {
                    this.services.set(serviceName, {
                        process: service,
                        port,
                        path: servicePath
                    });
                    resolve({ serviceName, port, process: service });
                } else {
                    setTimeout(checkReady, 1000);
                }
            };

            setTimeout(checkReady, 2000);
        });
    }

    /**
     * Start an HTTP server for testing
     */
    async startHttpServer(serviceName, app, port = 0) {
        return new Promise((resolve, reject) => {
            try {
                const server = app.listen(port, () => {
                    const actualPort = server.address().port;
                    this.httpServers.set(serviceName, {
                        server,
                        port: actualPort,
                        app
                    });
                    
                    this.logger.info(`HTTP server started: ${serviceName} on port ${actualPort}`);
                    resolve({ serviceName, port: actualPort, server });
                });

                server.on('error', (error) => {
                    this.logger.error(`Failed to start HTTP server ${serviceName}:`, error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Make HTTP requests to services
     */
    async makeRequest(serviceName, options = {}) {
        const { port } = this.httpServers.get(serviceName) || {};
        if (!port) {
            throw new Error(`Service ${serviceName} not found or not running`);
        }

        const requestOptions = {
            hostname: 'localhost',
            port,
            path: options.path || '/',
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'integration-test-framework',
                ...options.headers
            }
        };

        if (options.body) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
        }

        return new Promise((resolve, reject) => {
            const req = http.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: parsed,
                            rawBody: data
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: data,
                            rawBody: data
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.setTimeout(this.options.timeout, () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.options.timeout}ms`));
            });

            req.end();
        });
    }

    /**
     * Store test data for later use
     */
    setTestData(key, value) {
        this.testData.set(key, value);
    }

    /**
     * Get stored test data
     */
    getTestData(key) {
        return this.testData.get(key);
    }

    /**
     * Clear test data
     */
    clearTestData() {
        this.testData.clear();
    }

    /**
     * Check if port is available
     */
    isPortAvailable(port) {
        try {
            const server = http.createServer();
            server.listen(port);
            server.close();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Wait for a condition to be true
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await this.testHelpers.waitFor(interval);
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    }

    /**
     * Create test scenarios
     */
    createScenario(name, setupFn, testFn, cleanupFn) {
        return {
            name,
            setup: setupFn,
            test: testFn,
            cleanup: cleanupFn,
            async run() {
                try {
                    await setupFn.call(this);
                    const result = await testFn.call(this);
                    await cleanupFn.call(this);
                    return result;
                } catch (error) {
                    await cleanupFn.call(this);
                    throw error;
                }
            }
        };
    }

    /**
     * Run multiple scenarios
     */
    async runScenarios(scenarios) {
        const results = [];
        
        for (const scenario of scenarios) {
            this.logger.info(`Running scenario: ${scenario.name}`);
            
            try {
                const startTime = Date.now();
                const result = await scenario.run.call(this);
                const duration = Date.now() - startTime;
                
                results.push({
                    scenario: scenario.name,
                    status: 'passed',
                    duration,
                    result
                });
                
                this.logger.info(`Scenario ${scenario.name} passed (${duration}ms)`);
                
            } catch (error) {
                results.push({
                    scenario: scenario.name,
                    status: 'failed',
                    error: error.message,
                    stack: error.stack
                });
                
                this.logger.error(`Scenario ${scenario.name} failed:`, error);
                
                if (!this.options.parallel) {
                    break; // Stop on first failure if not running in parallel
                }
            }
        }
        
        return results;
    }

    /**
     * Clean up all services and servers
     */
    async cleanup() {
        this.logger.info('Cleaning up integration test framework');
        
        // Stop HTTP servers
        for (const [serviceName, { server }] of this.httpServers) {
            try {
                await new Promise((resolve) => {
                    server.close(resolve);
                });
                this.logger.info(`Stopped HTTP server: ${serviceName}`);
            } catch (error) {
                this.logger.error(`Error stopping server ${serviceName}:`, error);
            }
        }
        
        // Stop spawned services
        for (const [serviceName, { process }] of this.services) {
            try {
                process.kill('SIGTERM');
                await this.testHelpers.waitFor(1000);
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
                this.logger.info(`Stopped service: ${serviceName}`);
            } catch (error) {
                this.logger.error(`Error stopping service ${serviceName}:`, error);
            }
        }
        
        this.httpServers.clear();
        this.services.clear();
        this.clearTestData();
        
        await this.testHelpers.cleanup();
    }
}

module.exports = IntegrationTestFramework;