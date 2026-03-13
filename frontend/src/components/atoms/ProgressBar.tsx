import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressBarProps {
    value: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'danger';
    animated?: boolean;
    label?: string;
    showValue?: boolean;
    className?: string;
}

const sizeStyles: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

const colorStyles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    success: 'bg-gradient-to-r from-emerald-400 to-green-500',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-500',
    danger: 'bg-gradient-to-r from-rose-400 to-red-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    size = 'md',
    color = 'primary',
    animated = false,
    label,
    showValue = false,
    className,
}) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={cn('w-full', className)}>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-1.5">
                    {label && (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                    )}
                    {showValue && (
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{clampedValue}%</span>
                    )}
                </div>
            )}
            <div
                className={cn(
                    'w-full rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800',
                    sizeStyles[size]
                )}
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        colorStyles[color],
                        animated && 'relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-[shimmer_1.5s_infinite]'
                    )}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    );
};
