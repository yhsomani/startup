const { dispatchEvent } = require('../../src/services/events');

// Mock logger
jest.mock('../../src/config/config', () => ({
    config: {},
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('Event Service', () => {
    let mockIo;
    let mockSocket;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            join: jest.fn(),
        };
        mockIo = {
            to: jest.fn().mockReturnValue(mockSocket),
            emit: jest.fn()
        };
    });

    test('should handle course.created event', () => {
        const eventData = { courseTitle: 'Test Course', courseId: '123' };
        dispatchEvent(mockIo, { eventType: 'course.created', data: eventData });

        expect(mockIo.to).toHaveBeenCalledWith('students');
        expect(mockSocket.emit).toHaveBeenCalledWith('notification', expect.objectContaining({
            type: 'course.created',
            title: 'New Course Available'
        }));
    });

    test('should handle enrollment.created event', () => {
        const eventData = { userId: 'user1', courseTitle: 'Test Course' };
        dispatchEvent(mockIo, { eventType: 'enrollment.created', data: eventData });

        expect(mockIo.to).toHaveBeenCalledWith('user:user1');
        expect(mockSocket.emit).toHaveBeenCalledWith('notification', expect.objectContaining({
            type: 'enrollment.created',
            title: 'Enrollment Successful'
        }));
    });

    test('should handle unknown event type gracefully', () => {
        const { logger } = require('../../src/config/config');
        dispatchEvent(mockIo, { eventType: 'unknown.type', data: {} });

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unhandled event type'));
    });
});
