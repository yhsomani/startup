import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TagProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    onRemove?: () => void;
    className?: string;
    icon?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    onRemove,
    className,
    icon,
}) => {
    const baseStyles = 'inline-flex items-center gap-2 font-black uppercase italic tracking-widest transition-all duration-500 border-2';

    const sizeStyles = {
        sm: 'text-[9px] px-3 py-1 rounded-lg',
        md: 'text-[10px] px-4 py-1.5 rounded-xl',
        lg: 'text-[11px] px-5 py-2 rounded-2xl',
    };

    const variantStyles = {
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/50',
        secondary: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/20 hover:border-[var(--color-secondary)]/50',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20 hover:border-[var(--color-success)]/50',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20 hover:border-[var(--color-warning)]/50',
        error: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20 hover:border-[var(--color-error)]/50',
        neutral: 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30',
        outline: 'bg-transparent text-white/50 border-white/10 hover:border-[var(--color-secondary)] hover:text-white',
    };

    return (
        <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="truncate max-w-[150px]">{children}</span>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex-shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                >
                    <X size={size === 'sm' ? 10 : 12} />
                </button>
            )}
        </span>
    );
};
