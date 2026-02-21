/**
 * Public Route Component
 * 
 * Public route component for pages that don't require authentication
 * Opposite of ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children, fallbackTo = '/dashboard', adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Redirect authenticated users away from public routes
  if (isAuthenticated) {
    // Admin users should go to dashboard
    if (adminOnly && user?.role !== 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    // Authenticated users should go to dashboard
    return <Navigate to={fallbackTo} replace />;
  }
  
  return children;
};

export default PublicRoute;