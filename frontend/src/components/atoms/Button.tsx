import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'btn',
                    `btn-${variant}`,
                    size === 'icon' ? 'btn-icon-only' : `btn-${size}`,
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
