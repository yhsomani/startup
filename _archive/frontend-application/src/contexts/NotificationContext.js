/**
 * Notification Context
 * 
 * React Context for providing real-time notifications and notification management
 * Handles push notifications, WebSocket connections, and notification preferences
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Logger } from '../../../shared/logger';

// Initial context state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  websocket: null,
  permissions: {
    notification: true,
    desktop: true,
    sound: true,
  },
  settings: {
    enableDesktop: true,
    enableSound: true,
    enablePush: true,
    position: 'top-right',
    duration: 5000,
  },
  isLoading: false,
  error: null,
};

// Action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_WEBSOCKET: 'SET_WEBSOCKET',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
};

// Reducer function
const notificationReducer = (state, action) => {
  const logger = Logger('NotificationContext');
  
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      logger.debug('Adding notification', { id: action.payload.id, type: action.payload.type });
      
      const newNotification = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: action.payload.read || false,
      };
      
      const updatedNotifications = [newNotification, ...state.notifications];
      const unreadCount = updatedNotifications.filter(n => !n.read).length;
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount,
      };
      
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      logger.debug('Removing notification', { id: action.payload });
      const updatedNotifications = state.notifications.filter(n => n.id !== action.payload);
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      const unreadCount = removedNotification && !removedNotification.read 
        ? state.unreadCount - 1 
        : state.unreadCount;
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount,
      };
      
    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      logger.debug('Marking notification as read', { id: action.payload });
      const updatedNotifications = state.notifications.map(notification => 
        notification.id === action.payload 
          ? { ...notification, read: true, readAt: new Date().toISOString() }
          : notification
      );
      
      const readNotifications = updatedNotifications.filter(n => !n.read);
      const unreadCount = readNotifications.length;
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount,
      };
      
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      logger.debug('Marking all notifications as read');
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: new Date().toISOString(),
      }));
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0,
      };
      
    case NOTIFICATION_ACTIONS.SET_WEBSOCKET:
      logger.debug('Setting WebSocket connection');
      return {
        ...state,
        websocket: action.payload,
      };
      
    case NOTIFICATION_ACTIONS.SET_CONNECTED:
      logger.debug('Setting WebSocket connected status', { connected: action.payload });
      return {
        ...state,
        isConnected: action.payload,
      };
      
    case NOTIFICATION_ACTIONS.SET_LOADING:
      logger.debug('Setting loading status', { loading: action.payload });
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case NOTIFICATION_ACTIONS.SET_ERROR:
      logger.error('Setting notification error', { error: action.payload });
      return {
        ...state,
        error: action.payload,
      };
      
    case NOTIFICATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    case NOTIFICATION_ACTIONS.UPDATE_SETTINGS:
      logger.debug('Updating notification settings', { settings: action.payload });
      localStorage.setItem('notificationSettings', JSON.stringify(action.payload));
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
      
    case NOTIFICATION_ACTIONS.UPDATE_PERMISSIONS:
      logger.debug('Updating notification permissions', { permissions: action.payload });
      return {
        ...state,
        permissions: { ...state.permissions, ...action.payload },
      };
      
    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      logger.debug('Setting unread count', { count: action.payload });
      return {
        ...state,
        unreadCount: action.payload,
      };
      
    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      logger.debug('Clearing all notifications');
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
      
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext(initialState);

// Context Provider Component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // WebSocket connection
  const connectWebSocket = () => {
    if (state.websocket || !state.permissions.notification) {
      return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }
    
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'wss://localhost:8080';
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    
    ws.onopen = () => {
      logger.info('WebSocket connected');
      dispatch({ type: NOTIFICATION_ACTIONS.SET_WEBSOCKET, payload: ws });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_CONNECTED, payload: true });
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'notification':
            dispatch({
              type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
              payload: data.notification,
            });
            break;
            
          case 'unread_count':
            dispatch({
              type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT,
              payload: data.count,
            });
            break;
            
          case 'mark_read':
            dispatch({
              type: NOTIFICATION_ACTIONS.MARK_AS_READ,
              payload: data.notificationId,
            });
            break;
            
          default:
            logger.debug('Unknown WebSocket message type', { type: data.type });
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error, message: event.data });
      }
    };
    
    ws.onclose = (event) => {
      logger.warn('WebSocket disconnected', { code: event.code, reason: event.reason });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_CONNECTED, payload: false });
      
      // Attempt to reconnect after 5 seconds
      if (!event.wasClean) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };
    
    ws.onerror = (error) => {
      logger.error('WebSocket error', { error });
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: 'WebSocket connection failed',
      });
    };
  };
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [state.permissions.notification]);
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_PERMISSIONS,
          payload: { ...state.permissions, desktop: true },
        });
        logger.info('Notification permission granted');
      } else {
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_PERMISSIONS,
          payload: { ...state.permissions, desktop: false },
        });
        logger.warn('Notification permission denied', { permission });
      }
    } catch (error) {
      logger.error('Error requesting notification permission', { error });
    }
  };
  
  // Initialize notification permissions
  useEffect(() => {
    requestNotificationPermission();
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_SETTINGS,
          payload: JSON.parse(savedSettings),
        });
      } catch (error) {
        logger.error('Error parsing notification settings', { error });
      }
    }
  }, []);
  
  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window) || state.permission !== 'granted') {
      return;
    }
    
    if (state.settings.enableDesktop && !document.hidden) {
      const browserNotification = new Notification(notification.title || 'TalentSphere', {
        body: notification.message || notification.content,
        icon: '/favicon.ico',
        tag: notification.id,
        data: {
          notificationId: notification.id,
          type: notification.type,
        },
      });
      
      browserNotification.onclick = () => {
        // Focus the window and handle notification click
        window.focus();
        // Mark notification as read
        if (notification.id) {
          dispatch({
            type: NOTIFICATION_ACTIONS.MARK_AS_READ,
            payload: notification.id,
          });
        }
      };
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };
  
  // Show notification toast
  const showNotificationToast = (notification, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
      <div class="notification-content">
        <h4>${notification.title || 'Notification'}</h4>
        <p>${notification.message || notification.content}</p>
        <button onclick="this.parentElement.remove()">×</button>
      </div>
    `;
    
    toast.style.css = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#28a745' : '#007bff'};
      color: white;
      padding: 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 5000);
  };
  
  const contextValue = {
    ...state,
    
    // Actions
    addNotification: (notification) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
        payload: notification,
      });
      
      // Show browser notification
      showBrowserNotification(notification);
      
      // Show toast notification
      showNotificationToast(notification);
    },
    
    removeNotification: (id) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
        payload: id,
      });
    },
    
    markAsRead: (id) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_AS_READ,
        payload: id,
      });
    },
    
    markAllAsRead: () => {
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ,
      });
    },
    
    updateSettings: (settings) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_SETTINGS,
        payload: settings,
      });
      
      // Update notification permission if desktop notifications are toggled
      if (settings.enableDesktop !== state.settings.enableDesktop) {
        requestNotificationPermission();
      }
    },
    
    clearNotifications: () => {
      dispatch({
        type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS,
      });
    },
    
    clearError: () => {
      dispatch({
        type: NOTIFICATION_ACTIONS.CLEAR_ERROR,
      });
    },
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;