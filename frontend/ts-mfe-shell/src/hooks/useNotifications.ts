// TalentSphere Notification Client
// React hook for WebSocket notifications

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp: string;
    priority?: 'low' | 'normal' | 'high';
}

interface ProgressUpdate {
    courseId: string;
    progressPercentage: number;
    completedLessons?: number;
    totalLessons?: number;
    timestamp: string;
}

interface UseNotificationsOptions {
    autoConnect?: boolean;
    onNotification?: (notification: Notification) => void;
    onProgressUpdate?: (update: ProgressUpdate) => void;
    onError?: (error: Error) => void;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    isConnected: boolean;
    subscribe: (channel: string) => void;
    unsubscribe: (channel: string) => void;
    joinCourse: (courseId: string) => void;
    joinChallenge: (challengeId: string) => void;
    clearNotifications: () => void;
    connect: () => void;
    disconnect: () => void;
}

const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_URL || 'http://localhost:3030';

export function useNotifications(
    token: string | null,
    options: UseNotificationsOptions = {}
): UseNotificationsReturn {
    const {
        autoConnect = true,
        onNotification,
        onProgressUpdate,
        onError
    } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Connect to WebSocket server
    const connect = useCallback(() => {
        if (!token) {
            console.warn('No auth token provided, cannot connect to notification service');
            return;
        }

        if (socketRef.current?.connected) {
            console.log('Already connected to notification service');
            return;
        }

        console.log('Connecting to notification service...');

        const socket = io(NOTIFICATION_SERVICE_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Connected to notification service');
            setIsConnected(true);
        });

        socket.on('connected', (data: any) => {
            console.log('Welcome message:', data);
        });

        socket.on('notification', (notification: Notification) => {
            console.log('📬 Notification received:', notification);
            setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
            onNotification?.(notification);
        });

        socket.on('progress:updated', (update: ProgressUpdate) => {
            console.log('📊 Progress update:', update);
            onProgressUpdate?.(update);
        });

        socket.on('leaderboard:updated', (data: any) => {
            console.log('🏆 Leaderboard updated:', data);
        });

        socket.on('disconnect', (reason: string) => {
            console.log('❌ Disconnected from notification service:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error: Error) => {
            console.error('Connection error:', error.message);
            onError?.(error);
        });

        socket.on('error', (error: Error) => {
            console.error('Socket error:', error);
            onError?.(error);
        });

        socketRef.current = socket;
    }, [token, onNotification, onProgressUpdate, onError]);

    // Disconnect from WebSocket server
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
            console.log('Disconnected from notification service');
        }
    }, []);

    // Subscribe to a channel
    const subscribe = useCallback((channel: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('subscribe', { channel });
            console.log(`Subscribed to channel: ${channel}`);
        }
    }, []);

    // Unsubscribe from a channel
    const unsubscribe = useCallback((channel: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe', { channel });
            console.log(`Unsubscribed from channel: ${channel}`);
        }
    }, []);

    // Join course channel for real-time updates
    const joinCourse = useCallback((courseId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join:course', { courseId });
            console.log(`Joined course channel: ${courseId}`);
        }
    }, []);

    // Join challenge channel for leaderboard updates
    const joinChallenge = useCallback((challengeId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join:challenge', { challengeId });
            console.log(`Joined challenge channel: ${challengeId}`);
        }
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Auto-connect on mount if enabled
    useEffect(() => {
        if (autoConnect && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, token, connect, disconnect]);

    return {
        notifications,
        isConnected,
        subscribe,
        unsubscribe,
        joinCourse,
        joinChallenge,
        clearNotifications,
        connect,
        disconnect
    };
}

export default useNotifications;
