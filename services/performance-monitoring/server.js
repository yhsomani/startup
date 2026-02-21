const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
require('dotenv').config();

const PerformanceMonitoringService = require('./performance-monitoring-service');
const api = require('./api');

class PerformanceMonitoringServer {
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.port = process.env.PERFORMANCE_MONITORING_PORT || 3008;
        this.service = new PerformanceMonitoringService();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupGracefulShutdown();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.service.recordRequest(req.method, req.path, res.statusCode, duration);
                winston.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }

    setupRoutes() {
        this.app.use('/api/v1/performance', api);

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'performance-monitoring'
            });
        });

        // Prometheus metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            try {
                const metrics = await this.service.getPrometheusMetrics();
                res.set('Content-Type', 'text/plain');
                res.send(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            winston.info(`Client connected to performance monitoring: ${socket.id}`);

            // Send initial metrics
            this.broadcastMetrics();

            socket.on('disconnect', () => {
                winston.info(`Client disconnected from performance monitoring: ${socket.id}`);
            });
        });
    }

    broadcastMetrics() {
        setInterval(async () => {
            try {
                const metrics = await this.service.getRealTimeMetrics();
                this.io.emit('metrics-update', metrics);
            } catch (error) {
                winston.error('Error broadcasting metrics:', error);
            }
        }, 5000); // Broadcast every 5 seconds
    }

    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT'];

        signals.forEach(signal => {
            process.on(signal, async () => {
                winston.info(`Received ${signal}, shutting down gracefully...`);

                try {
                    await this.service.cleanup();
                    this.httpServer.close(() => {
                        winston.info('Performance monitoring server closed');
                        process.exit(0);
                    });
                } catch (error) {
                    winston.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
        });
    }

    async start() {
        try {
            await this.service.initialize();

            this.httpServer.listen(this.port, () => {
                winston.info(`🚀 Performance Monitoring Service listening on port ${this.port}`);
                winston.info(`📊 Metrics available at http://localhost:${this.port}/metrics`);
                winston.info(`🏥 Health check at http://localhost:${this.port}/health`);
                winston.info(`🔌 WebSocket server ready for real-time updates`);
            });
        } catch (error) {
            winston.error('Failed to start Performance Monitoring Service:', error);
            process.exit(1);
        }
    }
}

// Start the server
const server = new PerformanceMonitoringServer();
server.start();

module.exports = server;