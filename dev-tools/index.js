/**
 * Developer Tools and Hot Reloading System for TalentSphere
 * Comprehensive development environment with hot reloading, debugging, and productivity tools
 */

const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const chokidar = require("chokidar");
const { exec } = require("child_process");
const { getTracer } = require("../backends/shared/tracing");

class DevTools extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            enabled: true,
            watchDirs: config.watchDirs || ["backends", "api-gateway", "frontend"],
            ignorePatterns: config.ignorePatterns || [
                "**/node_modules/**",
                "**/logs/**",
                "**/*.log",
                "**/.git/**",
            ],
            hotReload: config.hotReload !== false,
            autoRestart: config.autoRestart !== false,
            debugMode: config.debugMode || false,
            logLevel: config.logLevel || "info",
            port: config.port || 3009,
            ...config,
        };

        this.tracer = getTracer();

        // Development state
        this.state = {
            isWatching: false,
            watchers: new Map(),
            runningProcesses: new Map(),
            lastChanges: new Map(),
            reloadCount: 0,
            startTime: Date.now(),
        };

        // Development tools
        this.tools = {
            fileWatcher: null,
            liveServer: null,
            debugServer: null,
            testRunner: null,
            apiTester: null,
        };

        // Initialize development environment
        this.initializeDevEnvironment();
    }

    initializeDevEnvironment() {
        if (!this.config.enabled) {
            return;
        }

        console.log("🛠️  Initializing Development Tools...");

        // Setup file watching
        this.setupFileWatcher();

        // Setup live reload server
        this.setupLiveReload();

        // Setup debug server
        this.setupDebugServer();

        // Setup test runner
        this.setupTestRunner();

        // Setup API tester
        this.setupAPITester();

        // Setup process management
        this.setupProcessManagement();

        console.log("✅ Development Tools initialized");
    }

    setupFileWatcher() {
        const span = this.tracer ? this.tracer.startSpan("devtools.filewatcher.setup") : null;

        try {
            this.tools.fileWatcher = chokidar.watch(this.config.watchDirs, {
                ignored: this.config.ignorePatterns,
                persistent: true,
                ignoreInitial: true,
            });

            this.tools.fileWatcher.on("change", filePath => {
                this.handleFileChange("change", filePath);
            });

            this.tools.fileWatcher.on("add", filePath => {
                this.handleFileChange("add", filePath);
            });

            this.tools.fileWatcher.on("unlink", filePath => {
                this.handleFileChange("unlink", filePath);
            });

            this.state.isWatching = true;

            console.log(`📁 Watching ${this.config.watchDirs.length} directories`);

            if (span) {
                span.setTag("watchdirs.count", this.config.watchDirs.length);
                span.finish();
            }
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            console.error("Failed to setup file watcher:", error);
        }
    }

    handleFileChange(type, filePath) {
        const span = this.tracer ? this.tracer.startSpan("devtools.file.change") : null;

        try {
            const change = {
                type,
                path: filePath,
                timestamp: Date.now(),
                extension: path.extname(filePath),
                directory: path.dirname(filePath),
                basename: path.basename(filePath),
            };

            this.state.lastChanges.set(filePath, change);
            this.state.reloadCount++;

            console.log(`📝 File ${type}: ${filePath}`);

            // Emit change event
            this.emit("fileChange", change);

            // Handle hot reload
            if (this.config.hotReload) {
                this.handleHotReload(change);
            }

            // Auto-restart services
            if (this.config.autoRestart) {
                this.handleAutoRestart(change);
            }

            // Update debug information
            if (this.tools.debugServer) {
                this.tools.debugServer.broadcastChange(change);
            }

            if (span) {
                span.setTag("file.type", type);
                span.setTag("file.extension", change.extension);
                span.finish();
            }
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            console.error("Error handling file change:", error);
        }
    }

    handleHotReload(change) {
        // Determine reload strategy based on file type
        const reloadStrategy = this.getReloadStrategy(change);

        if (reloadStrategy) {
            console.log(`🔄 Hot reloading: ${reloadStrategy.type}`);

            this.executeReloadStrategy(reloadStrategy, change);
        }
    }

    getReloadStrategy(change) {
        const strategies = {
            ".js": {
                type: "javascript",
                action: "restart-service",
                services: this.getAffectedServices(change.path),
            },
            ".css": {
                type: "stylesheet",
                action: "reload-css",
                inject: true,
            },
            ".html": {
                type: "template",
                action: "reload-page",
                inject: false,
            },
            ".json": {
                type: "config",
                action: "restart-all",
                critical: true,
            },
            ".env": {
                type: "environment",
                action: "restart-all",
                critical: true,
            },
        };

        return strategies[change.extension] || null;
    }

    getAffectedServices(filePath) {
        const servicePaths = {
            "api-gateway": ["api-gateway"],
            "auth-service": ["backends/backend-enhanced/auth-service"],
            "user-service": ["backends/backend-enhanced/user-service"],
            "job-service": ["backends/backend-enhanced/job-service"],
            shared: ["backends/shared"],
        };

        const affected = [];

        for (const [service, paths] of Object.entries(servicePaths)) {
            if (paths.some(p => filePath.startsWith(p))) {
                affected.push(service);
            }
        }

        return affected;
    }

    async executeReloadStrategy(strategy, change) {
        const span = this.tracer ? this.tracer.startSpan(`devtools.reload.${strategy.type}`) : null;

        try {
            switch (strategy.action) {
                case "restart-service":
                    await this.restartServices(strategy.services);
                    break;
                case "reload-css":
                    await this.reloadCSS(change.path);
                    break;
                case "reload-page":
                    await this.reloadPage();
                    break;
                case "restart-all":
                    await this.restartAllServices();
                    break;
            }

            if (span) {
                span.finish();
            }
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            console.error("Error executing reload strategy:", error);
        }
    }

    async restartServices(services) {
        for (const service of services) {
            try {
                console.log(`🔄 Restarting service: ${service}`);

                // Stop service if running
                if (this.state.runningProcesses.has(service)) {
                    await this.stopService(service);
                }

                // Start service
                await this.startService(service);

                this.emit("serviceRestarted", { service, timestamp: Date.now() });
            } catch (error) {
                console.error(`Failed to restart service ${service}:`, error);
                this.emit("serviceRestartFailed", { service, error, timestamp: Date.now() });
            }
        }
    }

    async restartAllServices() {
        const services = Array.from(this.state.runningProcesses.keys());
        await this.restartServices(services);
    }

    async reloadCSS(cssPath) {
        if (this.tools.liveServer) {
            this.tools.liveServer.broadcastCSSReload(cssPath);
            console.log(`🎨 CSS reloaded: ${cssPath}`);
        }
    }

    async reloadPage() {
        if (this.tools.liveServer) {
            this.tools.liveServer.broadcastPageReload();
            console.log("🔄 Page reloaded");
        }
    }

    setupLiveReload() {
        const WebSocket = require("ws");

        this.tools.liveServer = {
            wss: new WebSocket.Server({ port: this.config.port + 1 }),

            broadcast: function (message) {
                this.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
            },

            broadcastCSSReload: function (cssPath) {
                this.broadcast({
                    type: "css-reload",
                    path: cssPath,
                    timestamp: Date.now(),
                });
            },

            broadcastPageReload: function () {
                this.broadcast({
                    type: "page-reload",
                    timestamp: Date.now(),
                });
            },

            broadcastChange: function (change) {
                this.broadcast({
                    type: "file-change",
                    change,
                    timestamp: Date.now(),
                });
            },
        };

        console.log(`🔌 Live reload server on port ${this.config.port + 1}`);
    }

    setupDebugServer() {
        const express = require("express");
        const WebSocket = require("ws");

        const app = express();
        app.use(express.json());

        // Debug endpoints
        app.get("/debug/status", (req, res) => {
            res.json({
                status: "active",
                uptime: Date.now() - this.state.startTime,
                reloadCount: this.state.reloadCount,
                watching: this.state.isWatching,
                processes: Array.from(this.state.runningProcesses.keys()),
            });
        });

        app.get("/debug/metrics", (req, res) => {
            res.json({
                ...this.state,
                lastChanges: Array.from(this.state.lastChanges.values()).slice(-10),
            });
        });

        app.post("/debug/restart/:service", async (req, res) => {
            try {
                await this.restartServices([req.params.service]);
                res.json({ success: true, service: req.params.service });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post("/debug/reload", (req, res) => {
            this.reloadPage();
            res.json({ success: true });
        });

        // WebSocket for real-time debugging
        this.tools.debugServer = {
            app,
            wss: new WebSocket.Server({ port: this.config.port + 2 }),

            broadcastChange: function (change) {
                this.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(
                            JSON.stringify({
                                type: "debug",
                                data: change,
                            })
                        );
                    }
                });
            },
        };

        const server = app.listen(this.config.port);
        console.log(`🐛 Debug server on port ${this.config.port}`);
    }

    setupTestRunner() {
        this.tools.testRunner = {
            running: false,
            lastRun: null,

            async runTests(pattern = "**/*.test.js") {
                const span = this.tracer ? this.tracer.startSpan("devtools.tests.run") : null;

                try {
                    this.running = true;
                    console.log("🧪 Running tests...");

                    const result = await this.executeCommand(`npm test -- ${pattern}`);

                    this.lastRun = {
                        timestamp: Date.now(),
                        pattern,
                        result,
                        success: result.exitCode === 0,
                    };

                    this.emit("testsCompleted", this.lastRun);

                    if (span) {
                        span.setTag("tests.success", this.lastRun.success);
                        span.finish();
                    }

                    return this.lastRun;
                } catch (error) {
                    if (span) {
                        span.logError(error);
                        span.finish();
                    }
                    throw error;
                } finally {
                    this.running = false;
                }
            },
        };

        console.log("🧪 Test runner initialized");
    }

    setupAPITester() {
        this.tools.apiTester = {
            requests: [],

            async makeRequest(options) {
                const axios = require("axios");

                try {
                    const response = await axios(options);

                    const request = {
                        ...options,
                        response: {
                            status: response.status,
                            data: response.data,
                            headers: response.headers,
                        },
                        timestamp: Date.now(),
                        success: true,
                    };

                    this.requests.push(request);
                    this.emit("apiTestCompleted", request);

                    return request;
                } catch (error) {
                    const request = {
                        ...options,
                        error: error.message,
                        timestamp: Date.now(),
                        success: false,
                    };

                    this.requests.push(request);
                    this.emit("apiTestCompleted", request);

                    throw error;
                }
            },

            getRequests() {
                return this.requests.slice(-50); // Last 50 requests
            },

            clearRequests() {
                this.requests = [];
            },
        };

        console.log("🔍 API tester initialized");
    }

    setupProcessManagement() {
        process.on("SIGINT", () => {
            console.log("🛑 Shutting down development tools...");
            this.shutdown();
            process.exit(0);
        });

        process.on("SIGTERM", () => {
            console.log("🛑 Shutting down development tools...");
            this.shutdown();
            process.exit(0);
        });
    }

    async startService(serviceName) {
        const span = this.tracer
            ? this.tracer.startSpan(`devtools.service.start.${serviceName}`)
            : null;

        try {
            const serviceCommands = {
                "api-gateway": `cd api-gateway && node enhanced-gateway.js`,
                "auth-service": `cd backends/backend-enhanced/auth-service && node index.js`,
                "user-service": `cd backends/backend-enhanced/user-service && node index.js`,
                "job-service": `cd backends/backend-enhanced/job-service && node index.js`,
                dashboard: `cd monitoring/dashboard && node index.js`,
            };

            const command = serviceCommands[serviceName];
            if (!command) {
                throw new Error(`Unknown service: ${serviceName}`);
            }

            const process = this.executeCommand(command, true);

            this.state.runningProcesses.set(serviceName, {
                process,
                startTime: Date.now(),
                command,
                status: "running",
            });

            console.log(`✅ Service started: ${serviceName}`);

            if (span) {
                span.finish();
            }
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            throw error;
        }
    }

    async stopService(serviceName) {
        const span = this.tracer
            ? this.tracer.startSpan(`devtools.service.stop.${serviceName}`)
            : null;

        try {
            const serviceInfo = this.state.runningProcesses.get(serviceName);
            if (!serviceInfo) {
                console.log(`⚠️  Service not running: ${serviceName}`);
                return;
            }

            serviceInfo.process.kill("SIGTERM");
            this.state.runningProcesses.delete(serviceName);

            console.log(`🛑 Service stopped: ${serviceName}`);

            if (span) {
                span.finish();
            }
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            throw error;
        }
    }

    executeCommand(command, background = false) {
        return new Promise((resolve, reject) => {
            const proc = exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`${error.message} - stdout: ${stdout}, stderr: ${stderr}`));
                } else {
                    resolve({ stdout, stderr, exitCode: 0 });
                }
            });

            if (background) {
                resolve(proc);
            }

            proc.stdout.on("data", data => {
                if (this.config.debugMode) {
                    console.log(`[${command}] ${data}`);
                }
            });

            proc.stderr.on("data", data => {
                if (this.config.debugMode) {
                    console.error(`[${command}] ${data}`);
                }
            });
        });
    }

    handleAutoRestart(change) {
        const affectedServices = this.getAffectedServices(change.path);

        if (affectedServices.length > 0) {
            // Debounce rapid changes
            const now = Date.now();
            const lastChange = this.state.lastChanges.get(change.path);

            if (!lastChange || now - lastChange.timestamp > 1000) {
                console.log(`🔄 Auto-restarting affected services: ${affectedServices.join(", ")}`);

                // Delay restart to allow file write to complete
                setTimeout(() => {
                    this.restartServices(affectedServices);
                }, 500);
            }
        }
    }

    // Development utility methods
    async generateApiDocs() {
        const span = this.tracer ? this.tracer.startSpan("devtools.docs.generate") : null;

        try {
            console.log("📚 Generating API documentation...");

            // This would integrate with your API documentation generator
            const result = await this.executeCommand("npm run docs:generate");

            console.log("✅ API documentation generated");

            if (span) {
                span.finish();
            }

            return result;
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            throw error;
        }
    }

    async lintCode() {
        const span = this.tracer ? this.tracer.startSpan("devtools.lint") : null;

        try {
            console.log("🔍 Running linter...");

            const result = await this.executeCommand("npm run lint");

            console.log("✅ Linting completed");

            if (span) {
                span.finish();
            }

            return result;
        } catch (error) {
            if (span) {
                span.logError(error);
                span.finish();
            }
            throw error;
        }
    }

    async runUnitTests() {
        return this.tools.testRunner.runTests("**/*.unit.test.js");
    }

    async runIntegrationTests() {
        return this.tools.testRunner.runTests("**/*.integration.test.js");
    }

    getDevelopmentStats() {
        return {
            uptime: Date.now() - this.state.startTime,
            reloadCount: this.state.reloadCount,
            watching: this.state.isWatching,
            runningProcesses: Array.from(this.state.runningProcesses.keys()),
            lastChanges: Array.from(this.state.lastChanges.values()).slice(-10),
            configuration: this.config,
        };
    }

    async shutdown() {
        console.log("🛑 Shutting down development tools...");

        // Stop file watcher
        if (this.tools.fileWatcher) {
            await this.tools.fileWatcher.close();
        }

        // Stop running processes
        const runningServices = Array.from(this.state.runningProcesses.keys());
        for (const service of runningServices) {
            await this.stopService(service);
        }

        // Close servers
        if (this.tools.liveServer && this.tools.liveServer.wss) {
            this.tools.liveServer.wss.close();
        }

        if (this.tools.debugServer && this.tools.debugServer.wss) {
            this.tools.debugServer.wss.close();
        }

        console.log("✅ Development tools shutdown complete");
    }
}

// Middleware for Express integration
function createDevMiddleware(devTools) {
    return (req, res, next) => {
        // Add development tools to request
        req.devTools = devTools;

        // Add development headers
        res.setHeader("X-Dev-Mode", "enabled");
        res.setHeader("X-Dev-Reload-Count", devTools.state.reloadCount);

        next();
    };
}

// Client-side script for hot reloading
const hotReloadScript = `
(function() {
  const ws = new WebSocket('ws://localhost:${PORT + 1}');
  
  ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'css-reload':
        // Reload CSS files
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
          if (link.href.includes(message.path)) {
            link.href = link.href + '?t=' + Date.now();
          }
        });
        break;
        
      case 'page-reload':
        // Reload the page
        location.reload();
        break;
        
      case 'file-change':
        // Notify user of file changes
        console.log('File changed:', message.change);
        break;
    }
  };
  
  ws.onopen = function() {
    console.log('🔌 Hot reload connected');
  };
  
  ws.onclose = function() {
    console.log('🔌 Hot reload disconnected');
  };
})();
`;

module.exports = {
    DevTools,
    createDevMiddleware,
    hotReloadScript,
};
