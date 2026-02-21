const { logger } = require('../config/config');

const activeConnections = new Map(); // userId -> Set of socket IDs
const userSockets = new Map(); // socketId -> userId

const setupSocketConnection = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.userId;

        // Track active connections
        if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
        }
        activeConnections.get(userId).add(socket.id);
        userSockets.set(socket.id, userId);

        logger.info(`Client connected: ${socket.id}, User: ${userId}, Total connections: ${io.engine.clientsCount}`);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Join role-based rooms
        if (socket.userRole === 'INSTRUCTOR') {
            socket.join('instructors');
        } else if (socket.userRole === 'STUDENT') {
            socket.join('students');
        }

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to TalentSphere notifications',
            userId: userId,
            timestamp: new Date().toISOString()
        });

        // Handle subscription to specific channels
        socket.on('subscribe', (data) => {
            const { channel } = data;

            if (channel) {
                socket.join(channel);
                logger.info(`User ${userId} subscribed to channel: ${channel}`);
                socket.emit('subscribed', { channel, success: true });
            }
        });

        // Handle unsubscribe
        socket.on('unsubscribe', (data) => {
            const { channel } = data;

            if (channel) {
                socket.leave(channel);
                logger.info(`User ${userId} unsubscribed from channel: ${channel}`);
                socket.emit('unsubscribed', { channel, success: true });
            }
        });

        // Handle course enrollment notifications
        socket.on('join:course', (data) => {
            const { courseId } = data;
            socket.join(`course:${courseId}`);
            logger.info(`User ${userId} joined course channel: ${courseId}`);
        });

        // Handle challenge notifications
        socket.on('join:challenge', (data) => {
            const { challengeId } = data;
            socket.join(`challenge:${challengeId}`);
            logger.info(`User ${userId} joined challenge channel: ${challengeId}`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);

            // Clean up active connections
            if (activeConnections.has(userId)) {
                activeConnections.get(userId).delete(socket.id);
                if (activeConnections.get(userId).size === 0) {
                    activeConnections.delete(userId);
                }
            }
            userSockets.delete(socket.id);
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error(`Socket error for ${socket.id}:`, error);
        });
    });
};

module.exports = setupSocketConnection;
