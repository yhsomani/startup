import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        ({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast = { id, type, title, message, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm flex flex-col items-end pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Internal component to render each toast
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
        error: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',
        warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
        info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900',
    };

    return (
        <div
            className={cn(
                'flex w-full items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto',
                'animate-in slide-in-from-right-full fade-in duration-300',
                bgColors[toast.type]
            )}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {toast.title}
                </h4>
                {toast.message && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {toast.message}
                    </p>
                )}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <span className="sr-only">Close</span>
                <X size={16} />
            </button>
        </div>
    );
};
