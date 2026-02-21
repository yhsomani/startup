import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const Badge: React.FC<BadgeProps> = ({
    className = '',
    variant = 'default',
    children,
    ...props
}) => {
    const variants = {
        default: 'bg-blue-600 text-white',
        secondary: 'bg-gray-100 text-gray-900',
        outline: 'border border-gray-200 text-gray-900',
        destructive: 'bg-red-600 text-white'
    };

    return (
        <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
