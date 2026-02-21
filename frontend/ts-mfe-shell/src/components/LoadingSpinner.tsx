import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = '#4f46e5',
    className = ''
}) => {
    const sizeMap = {
        sm: '20px',
        md: '32px',
        lg: '48px'
    };

    const spinnerSize = sizeMap[size];

    return (
        <div
            className={`loading-spinner ${className}`}
            style={{
                width: spinnerSize,
                height: spinnerSize,
                border: `3px solid ${color}20`,
                borderTopColor: color,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }
            `}</style>
        </div>
    );
};

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

/**
 * Skeleton loader for content placeholders
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1rem',
    borderRadius = '4px',
    className = ''
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
            }}
            aria-hidden="true"
        >
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

interface SkeletonCardProps {
    lines?: number;
}

/**
 * Skeleton card for course/challenge list items
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
    return (
        <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '1rem'
        }}>
            <Skeleton height="1.5rem" width="60%" />
            <div style={{ marginTop: '0.5rem' }}>
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        height="0.875rem"
                        width={i === lines - 1 ? '40%' : '100%'}
                        className={i > 0 ? 'mt-2' : ''}
                    />
                ))}
            </div>
        </div>
    );
};

interface LoadingOverlayProps {
    message?: string;
}

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    message = 'Loading...'
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999
        }}>
            <LoadingSpinner size="lg" />
            {message && (
                <p style={{
                    marginTop: '1rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
