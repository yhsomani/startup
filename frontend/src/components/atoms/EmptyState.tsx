import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className ?? ''}`}>
        {icon && (
            <div className="mb-4 text-gray-300 dark:text-slate-600">
                {icon}
            </div>
        )}
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);
