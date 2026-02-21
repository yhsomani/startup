import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    redirectTo?: string;
}

/**
 * ProtectedRoute component that guards routes based on authentication and role.
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
 *   <InstructorDashboard />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    redirectTo = '/login'
}) => {
    const { isAuthenticated, isLoading, hasRole } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f9fafb'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #4f46e5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
        if (!hasRole(allowedRoles)) {
            return (
                <div style={{
                    maxWidth: '500px',
                    margin: '4rem auto',
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                    }}>
                        🔒
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Go Back
                    </button>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
