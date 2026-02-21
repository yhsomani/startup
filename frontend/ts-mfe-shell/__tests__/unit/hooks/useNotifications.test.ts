// useNotifications Hook - Comprehensive Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client');

describe('useNotifications Hook', () => {
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = {
            on: vi.fn(),
            emit: vi.fn(),
            disconnect: vi.fn(),
            connected: false,
        };

        (io as any).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Connection Management', () => {
        it('should connect automatically when token is provided', () => {
            const token = 'test-token';
            renderHook(() => useNotifications(token));

            expect(io).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    auth: { token },
                })
            );
        });

        it('should not connect when token is null', () => {
            renderHook(() => useNotifications(null));

            expect(io).not.toHaveBeenCalled();
        });

        it('should not connect when autoConnect is false', () => {
            const token = 'test-token';
            renderHook(() => useNotifications(token, { autoConnect: false }));

            expect(io).not.toHaveBeenCalled();
        });

        it('should disconnect on unmount', () => {
            const token = 'test-token';
            const { unmount } = renderHook(() => useNotifications(token));

            unmount();

            expect(mockSocket.disconnect).toHaveBeenCalled();
        });

        it('should update isConnected state on connect', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            // Simulate connection
            const connectHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'connect'
            )?.[1];

            act(() => {
                connectHandler?.();
            });

            expect(result.current.isConnected).toBe(true);
        });

        it('should update isConnected state on disconnect', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            // First connect
            const connectHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'connect'
            )?.[1];
            act(() => connectHandler?.());

            // Then disconnect - FIX: removed space before 'disconnect'
            const disconnectHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'disconnect'
            )?.[1];
            act(() => disconnectHandler?.('transport close'));

            expect(result.current.isConnected).toBe(false);
        });
    });

    describe('Receiving Notifications', () => {
        it('should add notification to state when received', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            const mockNotification = {
                type: 'course.published',
                title: 'New Course',
                message: 'A new course is available',
                timestamp: new Date().toISOString(),
            };

            const notificationHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'notification'
            )?.[1];

            act(() => {
                notificationHandler?.(mockNotification);
            });

            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0]).toEqual(mockNotification);
        });

        it('should call onNotification callback when notification received', () => {
            const onNotification = vi.fn();
            const token = 'test-token';
            renderHook(() => useNotifications(token, { onNotification }));

            const mockNotification = {
                type: 'lesson.completed',
                title: 'Lesson Complete',
                message: 'Great job!',
                timestamp: new Date().toISOString(),
            };

            const notificationHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'notification'
            )?.[1];

            act(() => {
                notificationHandler?.(mockNotification);
            });

            expect(onNotification).toHaveBeenCalledWith(mockNotification);
        });

        it('should limit notifications to 50', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            const notificationHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'notification'
            )?.[1];

            // Add 60 notifications
            act(() => {
                for (let i = 0; i < 60; i++) {
                    notificationHandler?.({
                        type: 'test',
                        title: `Notification ${i}`,
                        message: `Message ${i}`,
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            expect(result.current.notifications).toHaveLength(50);
            expect(result.current.notifications[0].title).toBe('Notification 59');
        });

        it('should handle progress updates', () => {
            const onProgressUpdate = vi.fn();
            const token = 'test-token';
            renderHook(() => useNotifications(token, { onProgressUpdate }));

            const mockProgress = {
                courseId: 'course-1',
                progressPercentage: 75,
                timestamp: new Date().toISOString(),
            };

            const progressHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'progress:updated'
            )?.[1];

            act(() => {
                progressHandler?.(mockProgress);
            });

            expect(onProgressUpdate).toHaveBeenCalledWith(mockProgress);
        });
    });

    describe('Channel Subscriptions', () => {
        it('should subscribe to channel', () => {
            const token = 'test-token';
            mockSocket.connected = true;
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.subscribe('announcements');
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
                channel: 'announcements',
            });
        });

        it('should unsubscribe from channel', () => {
            const token = 'test-token';
            mockSocket.connected = true;
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.unsubscribe('announcements');
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe', {
                channel: 'announcements',
            });
        });

        it('should join course channel', () => {
            const token = 'test-token';
            mockSocket.connected = true;
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.joinCourse('course-123');
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('join:course', {
                courseId: 'course-123',
            });
        });

        it('should join challenge channel', () => {
            const token = 'test-token';
            mockSocket.connected = true;
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.joinChallenge('challenge-456');
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('join:challenge', {
                challengeId: 'challenge-456',
            });
        });

        it('should not emit when disconnected', () => {
            const token = 'test-token';
            mockSocket.connected = false;
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.subscribe('test');
            });

            expect(mockSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should call onError on connection error', () => {
            const onError = vi.fn();
            const token = 'test-token';
            renderHook(() => useNotifications(token, { onError }));

            const errorHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )?.[1];

            const testError = new Error('Connection failed');
            act(() => {
                errorHandler?.(testError);
            });

            expect(onError).toHaveBeenCalledWith(testError);
        });

        it('should handle socket errors', () => {
            const onError = vi.fn();
            const token = 'test-token';
            renderHook(() => useNotifications(token, { onError }));

            const errorHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'error'
            )?.[1];

            const testError = new Error('Socket error');
            act(() => {
                errorHandler?.(testError);
            });

            expect(onError).toHaveBeenCalledWith(testError);
        });
    });

    describe('Utilities', () => {
        it('should clear all notifications', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            // Add some notifications
            const notificationHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'notification'
            )?.[1];

            act(() => {
                notificationHandler?.({
                    type: 'test',
                    title: 'Test',
                    message: 'Test',
                    timestamp: new Date().toISOString(),
                });
            });

            expect(result.current.notifications).toHaveLength(1);

            // Clear
            act(() => {
                result.current.clearNotifications();
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should manually connect', () => {
            const token = 'test-token';
            const { result } = renderHook(() =>
                useNotifications(token, { autoConnect: false })
            );

            expect(io).not.toHaveBeenCalled();

            act(() => {
                result.current.connect();
            });

            expect(io).toHaveBeenCalled();
        });

        it('should manually disconnect', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            act(() => {
                result.current.disconnect();
            });

            expect(mockSocket.disconnect).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid connect/disconnect', () => {
            const token = 'test-token';
            const { result } = renderHook(() =>
                useNotifications(token, { autoConnect: false })
            );

            act(() => {
                result.current.connect();
                result.current.disconnect();
                result.current.connect();
                result.current.disconnect();
            });

            expect(mockSocket.disconnect).toHaveBeenCalledTimes(2);
        });

        it('should handle token change', () => {
            let token = 'token-1';
            const { rerender } = renderHook(
                ({ token }) => useNotifications(token),
                { initialProps: { token } }
            );

            expect(io).toHaveBeenCalledTimes(1);

            // Change token
            token = 'token-2';
            rerender({ token });

            // Should disconnect old and connect new
            expect(mockSocket.disconnect).toHaveBeenCalled();
            expect(io).toHaveBeenCalledTimes(2);
        });

        it('should not crash with malformed notifications', () => {
            const token = 'test-token';
            const { result } = renderHook(() => useNotifications(token));

            const notificationHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'notification'
            )?.[1];

            // Send malformed notification
            act(() => {
                notificationHandler?.(null);
                notificationHandler?.(undefined);
                notificationHandler?.({});
            });

            // Should not crash
            expect(result.current.notifications.length).toBeGreaterThanOrEqual(0);
        });
    });
});
