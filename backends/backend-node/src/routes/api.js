const { logger } = require('../config/config');
const auth = require('../../../shared/middleware/auth');

const setupRoutes = (app, io) => {
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'notification-service',
            connections: io.engine.clientsCount,
            uptime: process.uptime()
        });
    });

    // API endpoint to send custom notifications (for admin use)
    app.post('/api/notify', auth.required, auth.requireAdmin, (req, res) => {
        const { userId, type, title, message, data } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({ error: 'userId, title, and message are required' });
        }

        io.to(`user:${userId}`).emit('notification', {
            type: type || 'custom',
            title,
            message,
            data,
            timestamp: new Date().toISOString()
        });

        logger.info(`Custom notification sent to user ${userId}`);
        res.json({ success: true, message: 'Notification sent' });
    });

    // API endpoint to broadcast to all users
    app.post('/api/broadcast', auth.required, auth.requireAdmin, (req, res) => {
        const { type, title, message, data } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'title and message are required' });
        }

        io.emit('notification', {
            type: type || 'broadcast',
            title,
            message,
            data,
            timestamp: new Date().toISOString()
        });

        logger.info('Broadcast notification sent to all users');
        res.json({ success: true, message: 'Broadcast sent', recipients: io.engine.clientsCount });
    });
    // status endpoint alias
    app.get('/status', (req, res) => {
        res.json({ status: 'running', uptime: process.uptime() });
    });

    // generic events endpoint
    app.post('/events', (req, res) => {
        const event = req.body;
        // console.log('Event received from external source');
        res.json({ status: 'received', event });
    });
};

module.exports = setupRoutes;
