import React, { useState } from 'react';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
}

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'New Course Available',
            message: 'Check out the latest course!',
            timestamp: new Date().toISOString()
        }
    ]);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                data-testid="notification-badge"
                style={{
                    position: 'relative',
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                🔔
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderRadius: '999px',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.75rem'
                    }}>
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '0.5rem',
                    width: '300px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 50
                }}>
                    <div style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Notifications</h4>
                        {notifications.map(notif => (
                            <div key={notif.id} style={{ marginBottom: '0.75rem' }}>
                                <p style={{ fontWeight: 'bold', margin: '0' }}>{notif.title}</p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    {notif.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
