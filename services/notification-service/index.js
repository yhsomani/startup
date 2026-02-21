/**
 * TalentSphere Notification Service
 * Real-time notifications for job applications and other events
 */

const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class NotificationService extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            port: options.port || process.env.NOTIFICATION_PORT || 8080,
            path: options.path || '/ws/notifications',
            maxPayload: options.maxPayload || 1024 * 1024, // 1MB
            verifyClient: options.verifyClient || null,
            clientTracking: true,
            ...options
        };

        this.clients = new Map();
        this.subscriptions = new Map(); // userId -> [clientId, ...]
        this.topics = new Map(); // topic -> [clientId, ...]

        this.server = null;
        this.wss = null;
    }

    /**
     * Initialize the WebSocket server
     */
    async initialize() {
        const server = http.createServer();
        this.wss = new WebSocket.Server({
            server,
            path: this.options.path,
            maxPayload: this.options.maxPayload,
            verifyClient: this.options.verifyClient,
            clientTracking: this.options.clientTracking
        });

        this.wss.on('connection', (ws, request) => {
            const clientId = uuidv4();
            this.clients.set(clientId, {
                ws,
                userId: null,
                subscriptions: new Set(),
                connectedAt: new Date()
            });

            // Handle incoming messages
            ws.on('message', (data) => {
                this.handleMessage(clientId, data);
            });

            // Handle client disconnect
            ws.on('close', () => {
                this.handleDisconnect(clientId);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
                this.emit('error', { clientId, error });
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                timestamp: new Date().toISOString()
            }));

            this.emit('clientConnected', { clientId, request });
        });

        this.server = server;
        await new Promise((resolve) => {
            this.server.listen(this.options.port, () => {
                console.log(`Notification server listening on port ${this.options.port}`);
                resolve();
            });
        });
    }

    /**
     * Handle incoming messages from clients
     */
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data);
            const client = this.clients.get(clientId);

            if (!client) {return;}

            switch (message.type) {
                case 'authenticate':
                    this.handleAuthentication(clientId, message.payload);
                    break;
                case 'subscribe':
                    this.handleSubscribe(clientId, message.topic);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(clientId, message.topic);
                    break;
                case 'ping':
                    client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                default:
                    this.emit('message', { clientId, message });
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    /**
     * Handle client authentication
     */
    handleAuthentication(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        // In a real implementation, you would verify the token
        // For now, we'll just accept the userId from the payload
        const { userId, token } = payload;

        if (userId) {
            client.userId = userId;

            // Register user subscriptions
            if (!this.subscriptions.has(userId)) {
                this.subscriptions.set(userId, new Set());
            }
            this.subscriptions.get(userId).add(clientId);

            client.ws.send(JSON.stringify({
                type: 'authenticated',
                userId,
                timestamp: new Date().toISOString()
            }));
        } else {
            client.ws.send(JSON.stringify({
                type: 'authFailed',
                message: 'Authentication failed',
                timestamp: new Date().toISOString()
            }));
        }
    }

    /**
     * Handle subscription to a topic
     */
    handleSubscribe(clientId, topic) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        if (!topic) {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'Topic is required for subscription',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        client.subscriptions.add(topic);

        // Register topic subscription
        if (!this.topics.has(topic)) {
            this.topics.set(topic, new Set());
        }
        this.topics.get(topic).add(clientId);

        client.ws.send(JSON.stringify({
            type: 'subscribed',
            topic,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle unsubscription from a topic
     */
    handleUnsubscribe(clientId, topic) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        if (client.subscriptions.has(topic)) {
            client.subscriptions.delete(topic);
        }

        if (this.topics.has(topic)) {
            this.topics.get(topic).delete(clientId);
        }

        client.ws.send(JSON.stringify({
            type: 'unsubscribed',
            topic,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle client disconnection
     */
    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        // Remove from user subscriptions
        if (client.userId) {
            const userSubscriptions = this.subscriptions.get(client.userId);
            if (userSubscriptions) {
                userSubscriptions.delete(clientId);
                if (userSubscriptions.size === 0) {
                    this.subscriptions.delete(client.userId);
                }
            }
        }

        // Remove from topic subscriptions
        for (const topic of client.subscriptions) {
            const topicClients = this.topics.get(topic);
            if (topicClients) {
                topicClients.delete(clientId);
                if (topicClients.size === 0) {
                    this.topics.delete(topic);
                }
            }
        }

        // Remove client
        this.clients.delete(clientId);

        this.emit('clientDisconnected', { clientId });
    }

    /**
     * Send a notification to a specific user
     */
    sendToUser(userId, notification) {
        const userClients = this.subscriptions.get(userId);
        if (!userClients || userClients.size === 0) {
            // User is not connected, store notification for later delivery
            this.storeOfflineNotification(userId, notification);
            return false;
        }

        const message = {
            type: 'notification',
            ...notification,
            timestamp: new Date().toISOString()
        };

        let sentCount = 0;
        for (const clientId of userClients) {
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
                sentCount++;
            }
        }

        return sentCount > 0;
    }

    /**
     * Send a notification to a specific topic
     */
    sendToTopic(topic, notification) {
        const topicClients = this.topics.get(topic);
        if (!topicClients || topicClients.size === 0) {
            return false;
        }

        const message = {
            type: 'notification',
            topic,
            ...notification,
            timestamp: new Date().toISOString()
        };

        let sentCount = 0;
        for (const clientId of topicClients) {
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
                sentCount++;
            }
        }

        return sentCount > 0;
    }

    /**
     * Broadcast notification to all connected clients
     */
    broadcast(notification) {
        const message = {
            type: 'broadcast',
            ...notification,
            timestamp: new Date().toISOString()
        };

        let sentCount = 0;
        for (const [clientId, client] of this.clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
                sentCount++;
            }
        }

        return sentCount;
    }

    /**
     * Store offline notification for later delivery
     */
    storeOfflineNotification(userId, notification) {
        // In a real implementation, this would store in a database
        // For now, we'll just emit an event
        this.emit('offlineNotification', { userId, notification });
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.clients.size,
            totalUsers: this.subscriptions.size,
            totalTopics: this.topics.size,
            activeTopics: Array.from(this.topics.keys()).filter(topic =>
                this.topics.get(topic).size > 0
            )
        };
    }

    /**
     * Close the notification service
     */
    async close() {
        if (this.wss) {
            this.wss.close();
        }

        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => resolve());
            });
        }
    }

    /**
     * Send job application notification
     */
    sendJobApplicationNotification(jobApplication) {
        const { applicantId, jobId, companyId, status } = jobApplication;

        // Notify applicant
        const applicantNotification = {
            id: uuidv4(),
            title: 'Job Application Status Update',
            message: `Your application for job ${jobId} has been updated to ${status}`,
            type: 'job_application_status',
            data: {
                applicationId: jobApplication.id,
                jobId,
                status,
                timestamp: jobApplication.updatedAt || new Date().toISOString()
            }
        };

        this.sendToUser(applicantId, applicantNotification);

        // Notify company
        const companyNotification = {
            id: uuidv4(),
            title: 'New Job Application',
            message: `New application received for job ${jobId}`,
            type: 'new_job_application',
            data: {
                applicationId: jobApplication.id,
                jobId,
                applicantId,
                status,
                timestamp: jobApplication.createdAt || new Date().toISOString()
            }
        };

        this.sendToUser(companyId, companyNotification);
    }

    /**
     * Send job matching notification
     */
    sendJobMatchNotification(userId, matchedJobs) {
        const notification = {
            id: uuidv4(),
            title: 'New Job Matches',
            message: `We found ${matchedJobs.length} new jobs that match your profile`,
            type: 'job_match',
            data: {
                matchedJobs,
                timestamp: new Date().toISOString()
            }
        };

        this.sendToUser(userId, notification);
    }

    /**
     * Send interview scheduled notification
     */
    sendInterviewScheduledNotification(interviewDetails) {
        const { applicantId, interviewerId, jobId, scheduledTime } = interviewDetails;

        // Notify applicant
        const applicantNotification = {
            id: uuidv4(),
            title: 'Interview Scheduled',
            message: `Your interview for job ${jobId} has been scheduled for ${scheduledTime}`,
            type: 'interview_scheduled',
            data: {
                interviewId: interviewDetails.id,
                jobId,
                scheduledTime,
                timestamp: new Date().toISOString()
            }
        };

        this.sendToUser(applicantId, applicantNotification);

        // Notify interviewer
        const interviewerNotification = {
            id: uuidv4(),
            title: 'Interview Scheduled',
            message: `New interview scheduled for job ${jobId} at ${scheduledTime}`,
            type: 'interview_scheduled',
            data: {
                interviewId: interviewDetails.id,
                jobId,
                applicantId,
                scheduledTime,
                timestamp: new Date().toISOString()
            }
        };

        this.sendToUser(interviewerId, interviewerNotification);
    }
}

module.exports = NotificationService;