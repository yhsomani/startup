import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    id?: string;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    id,
    className,
}) => {
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    };

    const sizeClasses = {
        sm: { track: 'w-7 h-4', thumb: 'w-3 h-3', translate: 'translate-x-3' },
        md: { track: 'w-10 h-6', thumb: 'w-5 h-5', translate: 'translate-x-4' },
        lg: { track: 'w-12 h-7', thumb: 'w-6 h-6', translate: 'translate-x-5' },
    };

    return (
        <label className={cn('inline-flex items-center gap-3 cursor-pointer group', disabled && 'opacity-50 cursor-not-allowed', className)}>
            <div
                id={id}
                role="switch"
                aria-checked={checked}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                onClick={handleToggle}
                className={cn(
                    'relative inline-flex items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    sizeClasses[size].track,
                    checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
            >
                <div
                    className={cn(
                        'bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out',
                        sizeClasses[size].thumb,
                        checked ? sizeClasses[size].translate : 'translate-x-0.5'
                    )}
                />
            </div>
            {label && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                    {label}
                </span>
            )}
        </label>
    );
};
