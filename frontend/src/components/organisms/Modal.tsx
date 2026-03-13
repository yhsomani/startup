import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOutsideClick?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnOutsideClick = true,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && closeOnOutsideClick) {
            onClose();
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={cn(
                    'bg-white dark:bg-slate-900 w-full rounded-2xl shadow-xl flex flex-col',
                    'animate-in zoom-in-95 duration-200',
                    sizeClasses[size]
                )}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {!title && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition-colors z-10"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className={cn('p-6 overflow-y-auto', size === 'full' ? 'flex-1' : 'max-h-[70vh]')}>
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
