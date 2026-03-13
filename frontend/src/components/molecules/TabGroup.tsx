import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface Tab {
    id: string;
    label: string | React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
}

export interface TabGroupProps {
    tabs: Tab[];
    defaultTabId?: string;
    variant?: 'underline' | 'pills' | 'vertical';
    className?: string;
    onChange?: (tabId: string) => void;
}

export const TabGroup: React.FC<TabGroupProps> = ({
    tabs,
    defaultTabId,
    variant = 'underline',
    className,
    onChange,
}) => {
    const [activeTab, setActiveTab] = useState(defaultTabId || (tabs[0]?.id ?? ''));

    const handleTabClick = (tab: Tab) => {
        if (tab.disabled) return;
        setActiveTab(tab.id);
        onChange?.(tab.id);
    };

    const isVertical = variant === 'vertical';

    const containerClasses = cn(
        'flex',
        isVertical ? 'flex-row gap-6' : 'flex-col w-full',
        className
    );

    const tabListClasses = cn(
        'flex',
        isVertical ? 'flex-col min-w-[200px] border-r border-gray-200 dark:border-gray-800' : 'flex-row overflow-x-auto hide-scrollbar',
        variant === 'underline' && !isVertical ? 'border-b border-gray-200 dark:border-gray-800' : '',
        variant === 'pills' && !isVertical ? 'gap-2 mb-4 p-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg inline-flex' : ''
    );

    return (
        <div className={containerClasses}>
            <div className={tabListClasses} role="tablist" aria-orientation={isVertical ? 'vertical' : 'horizontal'}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    let tabClasses = 'relative flex items-center justify-center font-medium text-sm transition-all focus:outline-none whitespace-nowrap px-4 py-2.5';

                    if (variant === 'underline') {
                        tabClasses = cn(
                            tabClasses,
                            'hover:text-primary',
                            isActive
                                ? 'text-primary'
                                : 'text-gray-500 dark:text-gray-400',
                            isActive && !isVertical ? 'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-t-sm' : '',
                            isActive && isVertical ? 'bg-primary/5 text-primary border-r-2 border-primary' : isVertical ? 'border-r-2 border-transparent hover:border-gray-300 hover:bg-gray-50/50' : ''
                        );
                    } else if (variant === 'pills') {
                        tabClasses = cn(
                            tabClasses,
                            'rounded-md px-4 py-2 text-sm',
                            isActive
                                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800/50'
                        );
                    }

                    if (tab.disabled) {
                        tabClasses = cn(tabClasses, 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500');
                    }

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            tabIndex={isActive ? 0 : -1}
                            className={tabClasses}
                            onClick={() => handleTabClick(tab)}
                            disabled={tab.disabled}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className={cn('flex-1', !isVertical && 'pt-4')}>
                {tabs.map((tab) => (
                    <div
                        key={`panel-${tab.id}`}
                        id={`panel-${tab.id}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${tab.id}`}
                        hidden={activeTab !== tab.id}
                        className={cn('outline-none focus:outline-none', activeTab !== tab.id && 'hidden')}
                    >
                        {activeTab === tab.id && tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
};
