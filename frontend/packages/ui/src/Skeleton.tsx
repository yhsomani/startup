/**
 * Skeleton Component
 * 
 * Loading placeholder with animation.
 * Rule: Always use skeletons, never spinners.
 */
import React from 'react';

export interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    animation?: 'pulse' | 'wave' | 'none';
}

const variantStyles: Record<string, string> = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
};

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'text',
    animation = 'pulse',
}) => {
    const baseStyles = 'bg-gray-200';
    const animationStyles = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-shimmer' : '';

    const style: React.CSSProperties = {
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${animationStyles} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

/**
 * Text skeleton with multiple lines
 */
export interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                width={i === lines - 1 ? '60%' : '100%'}
                height="0.875rem"
            />
        ))}
    </div>
);

/**
 * Card skeleton for loading states
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <Skeleton variant="rounded" height={160} className="mb-4" />
        <Skeleton variant="text" width="70%" height="1.25rem" className="mb-2" />
        <SkeletonText lines={2} />
        <div className="flex justify-between mt-4">
            <Skeleton variant="text" width={80} />
            <Skeleton variant="rounded" width={100} height={36} />
        </div>
    </div>
);

/**
 * Avatar skeleton
 */
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
    <Skeleton variant="circular" width={size} height={size} />
);

export default Skeleton;
