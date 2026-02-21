/**
 * TalentSphere Notification Service API
 * REST API wrapper for the WebSocket notification service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const NotificationService = require('./index');

class NotificationAPI {
    constructor(notificationService) {
        this.notificationService = notificationService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.'
            }
        });

        this.app.use(limiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const stats = this.notificationService.getStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                connections: stats.totalConnections,
                users: stats.totalUsers,
                topics: stats.totalTopics
            });
        });

        // Send notification to user
        this.app.post('/api/notifications/user/:userId', (req, res) => {
            const { userId } = req.params;
            const notification = req.body;

            if (!userId || !notification) {
                return res.status(400).json({
                    error: 'userId and notification are required'
                });
            }

            // Generate notification ID if not provided
            if (!notification.id) {
                notification.id = uuidv4();
            }

            const success = this.notificationService.sendToUser(userId, notification);

            res.json({
                success,
                notificationId: notification.id,
                userId,
                timestamp: new Date().toISOString()
            });
        });

        // Send notification to topic
        this.app.post('/api/notifications/topic/:topic', (req, res) => {
            const { topic } = req.params;
            const notification = req.body;

            if (!topic || !notification) {
                return res.status(400).json({
                    error: 'topic and notification are required'
                });
            }

            // Generate notification ID if not provided
            if (!notification.id) {
                notification.id = uuidv4();
            }

            const success = this.notificationService.sendToTopic(topic, notification);

            res.json({
                success,
                notificationId: notification.id,
                topic,
                timestamp: new Date().toISOString()
            });
        });

        // Broadcast notification
        this.app.post('/api/notifications/broadcast', (req, res) => {
            const notification = req.body;

            if (!notification) {
                return res.status(400).json({
                    error: 'notification is required'
                });
            }

            // Generate notification ID if not provided
            if (!notification.id) {
                notification.id = uuidv4();
            }

            const sentCount = this.notificationService.broadcast(notification);

            res.json({
                success: sentCount > 0,
                notificationId: notification.id,
                sentTo: sentCount,
                timestamp: new Date().toISOString()
            });
        });

        // Get connection statistics
        this.app.get('/api/stats', (req, res) => {
            const stats = this.notificationService.getStats();
            res.json(stats);
        });

        // Send job application notification
        this.app.post('/api/notifications/job-application', (req, res) => {
            const jobApplication = req.body;

            if (!jobApplication) {
                return res.status(400).json({
                    error: 'jobApplication data is required'
                });
            }

            try {
                this.notificationService.sendJobApplicationNotification(jobApplication);

                res.json({
                    success: true,
                    message: 'Job application notifications sent',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to send job application notifications',
                    details: error.message
                });
            }
        });

        // Send job match notification
        this.app.post('/api/notifications/job-match', (req, res) => {
            const { userId, matchedJobs } = req.body;

            if (!userId || !matchedJobs) {
                return res.status(400).json({
                    error: 'userId and matchedJobs are required'
                });
            }

            try {
                this.notificationService.sendJobMatchNotification(userId, matchedJobs);

                res.json({
                    success: true,
                    message: 'Job match notification sent',
                    userId,
                    matchedJobsCount: matchedJobs.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to send job match notification',
                    details: error.message
                });
            }
        });

        // Send interview scheduled notification
        this.app.post('/api/notifications/interview-scheduled', (req, res) => {
            const interviewDetails = req.body;

            if (!interviewDetails) {
                return res.status(400).json({
                    error: 'interviewDetails are required'
                });
            }

            try {
                this.notificationService.sendInterviewScheduledNotification(interviewDetails);

                res.json({
                    success: true,
                    message: 'Interview scheduled notifications sent',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to send interview scheduled notification',
                    details: error.message
                });
            }
        });

        // WebSocket endpoint info
        this.app.get('/api/websocket-info', (req, res) => {
            res.json({
                websocketEndpoint: `/ws/notifications`,
                protocols: ['talentsphere-notification-v1'],
                supportedEvents: [
                    'authenticate',
                    'subscribe',
                    'unsubscribe',
                    'ping'
                ],
                supportedNotificationTypes: [
                    'job_application_status',
                    'new_job_application',
                    'job_match',
                    'interview_scheduled',
                    'general_notification'
                ]
            });
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3005) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`Notification API server running on port ${port}`);
                console.log(`WebSocket endpoint: ws://localhost:${port}/ws/notifications`);
                resolve();
            });
        });
    }

    /**
     * Get the express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = NotificationAPI;