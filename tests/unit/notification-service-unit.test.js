/**
 * Unit Tests for Notification Service
 */

describe('NotificationService', () => {
    let NotificationService;
    let notificationService;

    beforeEach(() => {
        jest.resetModules();
    });

    test('should create notification service instance', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService({ port: 9999 });
        expect(service).toBeDefined();
        expect(service.options.port).toBe(9999);
    });

    test('should initialize with default options', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        expect(service.options.port).toBeDefined();
        expect(service.options.path).toBe('/ws/notifications');
    });

    test('should have client storage', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        expect(service.clients).toBeDefined();
        expect(service.clients instanceof Map).toBe(true);
    });

    test('should have topic storage', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        expect(service.topics).toBeDefined();
        expect(service.topics instanceof Map).toBe(true);
    });

    test('should subscribe client to topic', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.subscribeToTopic('user-1', 'job-updates');
        
        expect(service.topics.has('job-updates')).toBe(true);
        const subscribers = service.topics.get('job-updates');
        expect(subscribers).toContain('user-1');
    });

    test('should unsubscribe client from topic', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.subscribeToTopic('user-1', 'job-updates');
        service.unsubscribeFromTopic('user-1', 'job-updates');
        
        const subscribers = service.topics.get('job-updates');
        expect(subscribers).not.toContain('user-1');
    });

    test('should add client', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.addClient('client-1', 'user-1');
        
        expect(service.clients.has('client-1')).toBe(true);
    });

    test('should remove client', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.addClient('client-1', 'user-1');
        service.removeClient('client-1');
        
        expect(service.clients.has('client-1')).toBe(false);
    });

    test('should send notification to user', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.addClient('client-1', 'user-1');
        
        const notification = service.sendNotificationToUser('user-1', {
            type: 'job_match',
            title: 'New Job Match',
            message: 'You have a new job match!'
        });
        
        expect(notification).toBeDefined();
        expect(notification.type).toBe('job_match');
    });

    test('should broadcast to topic', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.subscribeToTopic('user-1', 'job-updates');
        service.subscribeToTopic('user-2', 'job-updates');
        
        const notification = service.broadcastToTopic('job-updates', {
            type: 'new_job',
            title: 'New Job Posted'
        });
        
        expect(notification).toBeDefined();
    });

    test('should get service status', () => {
        const { NotificationService } = require('../../services/notification-service/index');
        const service = new NotificationService();
        
        service.addClient('client-1', 'user-1');
        service.subscribeToTopic('user-1', 'job-updates');
        
        const status = service.getStatus();
        
        expect(status.clients).toBe(1);
        expect(status.topics).toBe(1);
    });
});

describe('Notification Types', () => {
    test('should create job application notification', () => {
        const createJobApplicationNotification = (data) => ({
            type: 'job_application',
            title: 'New Application',
            message: `${data.applicantName} applied for ${data.jobTitle}`,
            data: {
                jobId: data.jobId,
                applicantId: data.applicantId,
                jobTitle: data.jobTitle
            },
            timestamp: new Date().toISOString()
        });
        
        const notification = createJobApplicationNotification({
            jobId: 'job-1',
            applicantId: 'user-1',
            applicantName: 'John Doe',
            jobTitle: 'Software Engineer'
        });
        
        expect(notification.type).toBe('job_application');
        expect(notification.data.jobId).toBe('job-1');
    });

    test('should create job match notification', () => {
        const createJobMatchNotification = (data) => ({
            type: 'job_match',
            title: 'Job Match Found',
            message: `Your profile matches ${data.jobTitle} at ${data.company}`,
            data: {
                jobId: data.jobId,
                matchScore: data.matchScore
            },
            timestamp: new Date().toISOString()
        });
        
        const notification = createJobMatchNotification({
            jobId: 'job-1',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
            matchScore: 95
        });
        
        expect(notification.type).toBe('job_match');
        expect(notification.data.matchScore).toBe(95);
    });

    test('should create connection request notification', () => {
        const createConnectionNotification = (data) => ({
            type: 'connection_request',
            title: 'New Connection Request',
            message: `${data.senderName} wants to connect`,
            data: {
                senderId: data.senderId,
                profileId: data.profileId
            },
            timestamp: new Date().toISOString()
        });
        
        const notification = createConnectionNotification({
            senderId: 'user-1',
            senderName: 'John Doe',
            profileId: 'profile-1'
        });
        
        expect(notification.type).toBe('connection_request');
    });
});
