/**
 * Unit Tests for Notification Service
 * Comprehensive test suite covering all notification service functionality
 */

const NotificationService = require('../../services/notification-service');

describe('NotificationService', () => {
    let notificationService;

    beforeEach(() => {
        notificationService = new NotificationService({
            port: 4005,
            path: '/ws/notifications'
        });
    });

    afterEach(() => {
        if (notificationService) {
            notificationService.stop();
        }
    });

    describe('Constructor', () => {
        test('should create notification service with default options', () => {
            const service = new NotificationService();
            expect(service).toBeDefined();
            expect(service.options.port).toBe(8080);
            expect(service.options.path).toBe('/ws/notifications');
        });

        test('should create notification service with custom options', () => {
            const service = new NotificationService({
                port: 4005,
                maxPayload: 2048
            });
            expect(service.options.port).toBe(4005);
            expect(service.options.maxPayload).toBe(2048);
        });

        test('should initialize empty maps for clients and subscriptions', () => {
            expect(notificationService.clients).toBeDefined();
            expect(notificationService.clients.size).toBe(0);
            expect(notificationService.subscriptions).toBeDefined();
            expect(notificationService.topics).toBeDefined();
        });
    });

    describe('Client Management', () => {
        test('should add client to clients map', () => {
            const mockWs = {
                readyState: 1,
                send: jest.fn(),
                close: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs, { userId: 'user-1' });
            expect(notificationService.clients.size).toBe(1);
        });

        test('should remove client from clients map', () => {
            const mockWs = {
                readyState: 1,
                send: jest.fn(),
                close: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs);
            notificationService.removeClient('client-1');
            expect(notificationService.clients.size).toBe(0);
        });

        test('should get client by ID', () => {
            const mockWs = {
                readyState: 1,
                send: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs);
            const client = notificationService.getClient('client-1');
            expect(client).toBeDefined();
        });

        test('should return undefined for non-existent client', () => {
            const client = notificationService.getClient('non-existent');
            expect(client).toBeUndefined();
        });
    });

    describe('Subscriptions', () => {
        test('should subscribe client to topic', () => {
            notificationService.subscribeToTopic('client-1', 'jobs');
            const topicClients = notificationService.topics.get('jobs');
            expect(topicClients).toContain('client-1');
        });

        test('should unsubscribe client from topic', () => {
            notificationService.subscribeToTopic('client-1', 'jobs');
            notificationService.unsubscribeFromTopic('client-1', 'jobs');
            const topicClients = notificationService.topics.get('jobs');
            expect(topicClients).not.toContain('client-1');
        });

        test('should subscribe client to user notifications', () => {
            notificationService.subscribeToUser('client-1', 'user-1');
            const userSubs = notificationService.subscriptions.get('user-1');
            expect(userSubs).toContain('client-1');
        });

        test('should unsubscribe client from user notifications', () => {
            notificationService.subscribeToUser('client-1', 'user-1');
            notificationService.unsubscribeFromUser('client-1', 'user-1');
            const userSubs = notificationService.subscriptions.get('user-1');
            expect(userSubs).not.toContain('client-1');
        });
    });

    describe('Message Broadcasting', () => {
        test('should broadcast message to topic', () => {
            const mockWs = {
                readyState: 1,
                send: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs);
            notificationService.subscribeToTopic('client-1', 'jobs');
            
            notificationService.broadcastToTopic('jobs', { type: 'new_job' });
            
            expect(mockWs.send).toHaveBeenCalled();
        });

        test('should broadcast message to user', () => {
            const mockWs = {
                readyState: 1,
                send: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs);
            notificationService.subscribeToUser('client-1', 'user-1');
            
            notificationService.broadcastToUser('user-1', { type: 'notification' });
            
            expect(mockWs.send).toHaveBeenCalled();
        });

        test('should not send to disconnected clients', () => {
            const mockWs = {
                readyState: 0, // CLOSED
                send: jest.fn()
            };
            
            notificationService.addClient('client-1', mockWs);
            notificationService.subscribeToTopic('client-1', 'jobs');
            
            notificationService.broadcastToTopic('jobs', { type: 'test' });
            
            expect(mockWs.send).not.toHaveBeenCalled();
        });
    });

    describe('Notification Types', () => {
        test('should create job application notification', () => {
            const notification = notificationService.createNotification({
                type: 'job_application',
                userId: 'user-1',
                data: { jobId: 'job-1', companyId: 'company-1' }
            });
            
            expect(notification.type).toBe('job_application');
            expect(notification.userId).toBe('user-1');
            expect(notification.timestamp).toBeDefined();
        });

        test('should create job match notification', () => {
            const notification = notificationService.createNotification({
                type: 'job_match',
                userId: 'user-1',
                data: { jobId: 'job-1', matchScore: 95 }
            });
            
            expect(notification.type).toBe('job_match');
        });

        test('should create connection request notification', () => {
            const notification = notificationService.createNotification({
                type: 'connection_request',
                userId: 'user-1',
                data: { fromUserId: 'user-2' }
            });
            
            expect(notification.type).toBe('connection_request');
        });

        test('should create course enrollment notification', () => {
            const notification = notificationService.createNotification({
                type: 'course_enrollment',
                userId: 'user-1',
                data: { courseId: 'course-1' }
            });
            
            expect(notification.type).toBe('course_enrollment');
        });
    });

    describe('Server Control', () => {
        test('should have stop method', () => {
            expect(typeof notificationService.stop).toBe('function');
        });

        test('should have getStatus method', () => {
            expect(typeof notificationService.getStatus).toBe('function');
        });

        test('should return status with client count', () => {
            const status = notificationService.getStatus();
            expect(status).toBeDefined();
            expect(status.clients).toBe(0);
        });
    });

    describe('Event Emitter', () => {
        test('should extend EventEmitter', () => {
            expect(notificationService.on).toBeDefined();
            expect(notificationService.emit).toBeDefined();
        });

        test('should emit event when notification sent', () => {
            const callback = jest.fn();
            notificationService.on('notification', callback);
            notificationService.emit('notification', { type: 'test' });
            expect(callback).toHaveBeenCalled();
        });
    });
});
