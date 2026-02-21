// TalentSphere Real-time Notification Service
// Modularized Architecture

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('../shared/config');
const corsMiddleware = require('../shared/middleware/cors');
const socketAuth = require('./src/middleware/auth');
const setupSocketConnection = require('./src/sockets/connection');
const { connectRabbitMQ, closeRabbitMQ } = require('./src/services/rabbitmq');
const setupRoutes = require('./src/routes/api');

// Express app
const app = express();
const server = http.createServer(app);

// Socket.io server with CORS
const serviceConfig = config.getServiceConfig('notifications');
const io = new Server(server, {
    cors: serviceConfig.socket.cors,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Setup API Routes
setupRoutes(app, io);

// Socket Auth Middleware
io.use(socketAuth);

// Initialize Socket Connection Logic
setupSocketConnection(io);

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing connections...');
    await closeRabbitMQ();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(serviceConfig.port, () => {
    console.log(`📡 Notification Service running on port ${serviceConfig.port}`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${serviceConfig.port}`);
    console.log(`💚 Health check: http://localhost:${serviceConfig.port}/health`);
    console.log(`🌐 CORS origins: ${serviceConfig.socket.cors.origin.join(', ')}`);

    // Connect to RabbitMQ
    connectRabbitMQ(io);
});

module.exports = { app, io };

