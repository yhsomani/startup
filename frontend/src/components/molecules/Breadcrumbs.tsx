import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
            <Link
                to="/"
                className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                aria-label="Home"
            >
                <Home size={14} />
            </Link>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
                        {isLast || !item.href ? (
                            <span
                                className={cn(
                                    'font-medium truncate max-w-[200px]',
                                    isLast
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-primary cursor-pointer'
                                )}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                to={item.href}
                                className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors truncate max-w-[200px]"
                            >
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
