import React, { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center min-h-32 py-12 text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Something went wrong</p>
                    <p className="text-xs text-gray-500 mb-4">{this.state.error?.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="text-xs text-primary underline"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
