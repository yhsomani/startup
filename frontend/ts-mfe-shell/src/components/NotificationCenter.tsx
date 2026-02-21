// Notification Display Component
import React from 'react';
import './NotificationCenter.css';

interface Notification {
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp: string;
    priority?: 'low' | 'normal' | 'high';
}

interface NotificationCenterProps {
    notifications: Notification[];
    isConnected: boolean;
    onClear: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    isConnected,
    onClear
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const unreadCount = notifications.length;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'course.created':
            case 'course.published':
                return '📚';
            case 'enrollment.created':
                return '🎓';
            case 'lesson.completed':
                return '✅';
            case 'challenge.submitted':
                return '💻';
            case 'challenge.graded':
                return '📊';
            case 'certificate.issued':
                return '🏆';
            case 'progress.updated':
                return '📈';
            default:
                return '🔔';
        }
    };

    const getPriorityClass = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'priority-high';
            case 'low':
                return 'priority-low';
            default:
                return 'priority-normal';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    return (
        <div className="notification-center">
            {/* Notification Bell */}
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
                <span className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
                                {isConnected ? '🟢 Live' : '🔴 Offline'}
                            </span>
                            {notifications.length > 0 && (
                                <button onClick={onClear} className="btn-clear">
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>🔕 No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification, index) => (
                                <div
                                    key={`${notification.timestamp}-${index}`}
                                    className={`notification-item ${getPriorityClass(notification.priority)}`}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <h4>{notification.title}</h4>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">
                                            {formatTimestamp(notification.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
