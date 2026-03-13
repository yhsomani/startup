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
    const baseStyles = 'inline-flex items-center justify-center font-black uppercase italic tracking-[0.2em] rounded-xl transition-all duration-500';

    const sizeStyles = {
        sm: 'text-[9px] px-3 py-1',
        md: 'text-[10px] px-4 py-1.5',
    };

    const variantStyles = {
        primary: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-[0_0_15px_rgba(140,37,244,0.1)]',
        secondary: 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30 shadow-[0_0_15px_rgba(19,236,236,0.1)]',
        success: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30',
        warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-[var(--color-warning)]/30',
        error: 'bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30',
        outline: 'border-2 border-white/10 text-white/70 hover:border-white/20 hover:text-white',
        neutral: 'bg-white/5 text-slate-400 border border-white/10',
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
