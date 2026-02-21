/**
 * Card Component
 * 
 * Content container with optional header/footer.
 */
import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddingStyles: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const shadowStyles: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    shadow = 'sm',
    hover = false,
}) => {
    const baseStyles = 'bg-white rounded-xl border border-gray-200';
    const hoverStyles = hover ? 'transition-shadow hover:shadow-lg cursor-pointer' : '';

    return (
        <div className={`${baseStyles} ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyles} ${className}`}>
            {children}
        </div>
    );
};

export interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
        {children}
    </div>
);

export interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
        {children}
    </h3>
);

export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
        {children}
    </div>
);

export default Card;
