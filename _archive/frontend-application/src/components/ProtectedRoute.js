/**
 * Protected Route Component
 * 
 * Higher-order component for protecting routes that require authentication
 * Redirects to login if user is not authenticated
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { Logger } from '../../../shared/logger';

const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isAuthFromStore = useSelector(selectIsAuthenticated);
  
  // Check if user has required role
  const hasRequiredRole = requiredRole === 'user' || 
    (requiredRole === 'admin' && user?.role === 'admin') ||
    (requiredRole === 'instructor' && user?.role === 'instructor') ||
    (requiredRole === 'recruiter' && user?.role === 'recruiter');
  
  const logger = Logger('ProtectedRoute');
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !hasRequiredRole) {
    logger.debug('Redirecting to login', { 
      path: location.pathname,
      reason: !isAuthenticated ? 'not_authenticated' : 'insufficient_role',
      userRole: user?.role,
      requiredRole 
    });
    
    // Store the attempted URL for redirect after login
    sessionStorage.setItem('redirectPath', location.pathname + location.search);
    
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  
  // Check if component should be rendered based on authentication state
  const shouldRender = isAuthFromStore || requiredRole === 'guest';
  
  if (!shouldRender) {
    return null;
  }
  
  return children;
};

export default ProtectedRoute;