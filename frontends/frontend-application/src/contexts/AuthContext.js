/**
 * Authentication Context
 * 
 * React Context for providing authentication state and methods
 * Handles user authentication, token management, and auth-related utilities
 */

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginUser, logoutUser, refreshToken } from '../store/slices/authSlice';
import { Logger } from '../../../shared/logger';

// Initial context state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginStatus: 'idle', // idle, loading, succeeded, failed
  logoutStatus: 'idle',
  refreshTokenStatus: 'idle',
  lastActivity: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_LAST_ACTIVITY: 'UPDATE_LAST_ACTIVITY',
  RESET_AUTH: 'RESET_AUTH',
};

// Reducer function
const authReducer = (state, action) => {
  const logger = Logger('AuthContext');
  
  switch (action.type) {
    case AUTH_ACTIONS.SET_USER:
      logger.debug('Setting user', { userId: action.payload?.id });
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload && !!state.token,
      };
      
    case AUTH_ACTIONS.SET_TOKEN:
      logger.debug('Setting token', { hasToken: !!action.payload });
      localStorage.setItem('authToken', action.payload);
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload && !!state.user,
      };
      
    case AUTH_ACTIONS.SET_AUTHENTICATED:
      logger.debug('Setting authenticated status', { authenticated: action.payload });
      return {
        ...state,
        isAuthenticated: action.payload,
      };
      
    case AUTH_ACTIONS.SET_LOADING:
      logger.debug('Setting loading status', { loading: action.payload });
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case AUTH_ACTIONS.SET_ERROR:
      logger.error('Setting auth error', { error: action.payload });
      return {
        ...state,
        error: action.payload,
        isAuthenticated: false,
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    case AUTH_ACTIONS.UPDATE_LAST_ACTIVITY:
      logger.debug('Updating last activity', { activity: action.payload });
      return {
        ...state,
        lastActivity: action.payload,
      };
      
    case AUTH_ACTIONS.RESET_AUTH:
      logger.info('Resetting auth context');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      return {
        ...initialState,
      };
      
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(initialState);

// Context Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const reduxDispatch = useDispatch();
  
  // Sync with Redux store
  useEffect(() => {
    // Update Redux when context state changes
    if (state.user) {
      // This would be handled by Redux slices
    }
    
    // Update context when Redux state changes
    const authState = useSelector(state => state.auth);
    if (authState.isAuthenticated !== state.isAuthenticated) {
      dispatch({
        type: AUTH_ACTIONS.SET_AUTHENTICATED,
        payload: authState.isAuthenticated,
      });
    }
    
    if (authState.error !== state.error) {
      dispatch({
        type: authState.error ? AUTH_ACTIONS.SET_ERROR : AUTH_ACTIONS.CLEAR_ERROR,
        payload: authState.error,
      });
    }
  }, [state.isAuthenticated, state.user, state.error, reduxDispatch]);
  
  // Token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) {
      return;
    }
    
    const refreshInterval = setInterval(async () => {
      try {
        const result = await reduxDispatch(refreshToken());
        if (result.error) {
          logger.error('Token refresh failed', { error: result.error });
          dispatch({
            type: AUTH_ACTIONS.SET_ERROR,
            payload: result.error,
          });
        }
      } catch (error) {
        logger.error('Token refresh error', { error });
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: error.message,
        });
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes
    
    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.token, reduxDispatch]);
  
  // Activity tracking
  useEffect(() => {
    const activityTracker = () => {
      const now = new Date();
      dispatch({
        type: AUTH_ACTIONS.UPDATE_LAST_ACTIVITY,
        payload: now,
      });
      
      // Update last activity in localStorage
      localStorage.setItem('lastActivity', now.toISOString());
    };
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, activityTracker, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityTracker);
      });
    };
  }, []);
  
  const contextValue = {
    ...state,
    
    // Actions
    login: async (credentials) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        const result = await reduxDispatch(loginUser(credentials));
        
        if (result.error) {
          dispatch({
            type: AUTH_ACTIONS.SET_ERROR,
            payload: result.error,
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: result.payload.user,
          });
          dispatch({
            type: AUTH_ACTIONS.SET_TOKEN,
            payload: result.payload.token,
          });
          dispatch({
            type: AUTH_ACTIONS.SET_AUTHENTICATED,
            payload: true,
          });
        }
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: error.message,
        });
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    },
    
    logout: async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        const result = await reduxDispatch(logoutUser());
        
        if (result.error) {
          dispatch({
            type: AUTH_ACTIONS.SET_ERROR,
            payload: result.error,
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.RESET_AUTH,
          });
        }
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: error.message,
        });
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    },
    
    clearError: () => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    },
    
    refreshToken: async () => {
      try {
        const result = await reduxDispatch(refreshToken());
        
        if (result.error) {
          dispatch({
            type: AUTH_ACTIONS.SET_ERROR,
            payload: result.error,
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.SET_TOKEN,
            payload: result.payload.token,
          });
        }
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: error.message,
        });
      }
    },
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protecting routes
export const withAuth = (Component) => {
  const AuthenticatedComponent = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading authentication...</div>;
    }
    
    if (!isAuthenticated) {
      return (
        <div>
          <h2>Authentication Required</h2>
          <p>Please log in to access this page.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

export default AuthContext;