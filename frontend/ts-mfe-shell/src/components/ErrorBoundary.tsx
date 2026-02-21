import { Component, ErrorInfo, ReactNode } from 'react';
import { Sentry } from '../sentry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child
 * component tree and display a fallback UI instead of crashing.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Log error to error reporting service
        if (import.meta.env.PROD) {
            Sentry.captureException(error, { extra: { ...errorInfo } });
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '500px'
                    }}>
                        <h2 style={{
                            color: '#dc2626',
                            fontSize: '1.5rem',
                            marginBottom: '1rem'
                        }}>
                            ⚠️ Something went wrong
                        </h2>
                        <p style={{
                            color: '#7f1d1d',
                            marginBottom: '1.5rem'
                        }}>
                            We're sorry, but something unexpected happened. Please try again.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details style={{
                                textAlign: 'left',
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: '#fff',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                                    Error Details (Dev Only)
                                </summary>
                                <pre style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    color: '#dc2626'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'transparent',
                                    color: '#4f46e5',
                                    border: '2px solid #4f46e5',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
