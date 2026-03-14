import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'neutral';
    size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-black uppercase italic tracking-[0.3em] rounded-lg transition-all duration-500 border';

    const sizeStyles = {
        sm: 'text-[8px] px-2.5 py-0.5',
        md: 'text-[9px] px-3.5 py-1',
    };

    const variantStyles = {
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 shadow-[0_0_20px_rgba(140,37,244,0.1)]',
        secondary: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/20 shadow-[0_0_20px_rgba(19,236,236,0.1)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
        error: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20',
        outline: 'border-white/10 text-white/50 hover:border-white/30 hover:text-white',
        neutral: 'bg-white/5 text-slate-500 border-white/10',
    };

    return (
        <span
            className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
};
