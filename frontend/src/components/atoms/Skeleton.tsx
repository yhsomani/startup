import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps {
    width?: string;
    height?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    className?: string;
    lines?: number; // For text variant, number of lines
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    variant = 'text',
    className,
    lines = 1,
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-slate-700';

    const variantClasses = {
        text: 'rounded-md',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const defaultHeights = {
        text: '1em',
        circular: width || '40px',
        rectangular: '120px',
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className={cn('space-y-2', className)}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(baseClasses, variantClasses.text)}
                        style={{
                            width: i === lines - 1 ? '70%' : (width || '100%'),
                            height: height || defaultHeights.text,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            style={{
                width: width || (variant === 'text' ? '100%' : undefined),
                height: height || defaultHeights[variant],
            }}
        />
    );
};

// Convenience skeleton card for job/course listings
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3', className)}>
        <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="44px" height="44px" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height="16px" />
                <Skeleton variant="text" width="40%" height="12px" />
            </div>
        </div>
        <Skeleton variant="text" lines={2} />
        <div className="flex gap-2">
            <Skeleton variant="rectangular" width="60px" height="24px" />
            <Skeleton variant="rectangular" width="80px" height="24px" />
        </div>
    </div>
);
