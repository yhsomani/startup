/**
 * WebSocket Context
 * 
 * React Context for managing WebSocket connections for real-time features
 * Handles chat, presence, collaboration, and live updates
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Logger } from '../../../shared/logger';

// WebSocket connection status
const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// Initial context state
const initialState = {
  status: CONNECTION_STATUS.DISCONNECTED,
  websocket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: 5000,
  lastPing: null,
  pingInterval: 30000, // 30 seconds
  messages: [],
  isConnected: false,
  error: null,
  // Room management
  currentRoom: null,
  rooms: [],
  // Presence management
  onlineUsers: [],
  presence: {},
  // Collaboration state
  isTyping: false,
  typingUsers: [],
  lastTypingTime: null,
  // Real-time features
  features: {
    chat: true,
    presence: true,
    collaboration: true,
    notifications: true,
    screenShare: false,
    voiceCall: false,
  },
};

// Action types
const WEBSOCKET_ACTIONS = {
  SET_STATUS: 'SET_STATUS',
  SET_WEBSOCKET: 'SET_WEBSOCKET',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  UPDATE_PRESENCE: 'UPDATE_PRESENCE',
  SET_TYPING_STATUS: 'SET_TYPING_STATUS',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  SET_FEATURES: 'SET_FEATURES',
  PING: 'PING',
  PONG: 'PONG',
};

// Reducer function
const websocketReducer = (state, action) => {
  const logger = Logger('WebSocketContext');
  
  switch (action.type) {
    case WEBSOCKET_ACTIONS.SET_STATUS:
      logger.debug('Setting WebSocket status', { status: action.payload });
      return {
        ...state,
        status: action.payload,
        isConnected: action.payload === CONNECTION_STATUS.CONNECTED,
      };
      
    case WEBSOCKET_ACTIONS.SET_WEBSOCKET:
      logger.debug('Setting WebSocket connection');
      return {
        ...state,
        websocket: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.SET_CONNECTED:
      logger.debug('Setting connected status', { connected: action.payload });
      return {
        ...state,
        isConnected: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.SET_ERROR:
      logger.error('Setting WebSocket error', { error: action.payload });
      return {
        ...state,
        error: action.payload,
        status: CONNECTION_STATUS.ERROR,
        isConnected: false,
      };
      
    case WEBSOCKET_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        status: CONNECTION_STATUS.DISCONNECTED,
      };
      
    case WEBSOCKET_ACTIONS.ADD_MESSAGE:
      logger.debug('Adding WebSocket message', { type: action.payload.type, id: action.payload.id });
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
      
    case WEBSOCKET_ACTIONS.UPDATE_MESSAGE:
      logger.debug('Updating WebSocket message', { id: action.payload.id });
      const updatedMessages = state.messages.map(msg => 
        msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
      );
      return {
        ...state,
        messages: updatedMessages,
      };
      
    case WEBSOCKET_ACTIONS.REMOVE_MESSAGE:
      logger.debug('Removing WebSocket message', { id: action.payload });
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };
      
    case WEBSOCKET_ACTIONS.CLEAR_MESSAGES:
      logger.debug('Clearing WebSocket messages');
      return {
        ...state,
        messages: [],
      };
      
    case WEBSOCKET_ACTIONS.SET_CURRENT_ROOM:
      logger.debug('Setting current room', { room: action.payload });
      return {
        ...state,
        currentRoom: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.JOIN_ROOM:
      logger.debug('Joining room', { room: action.payload });
      return {
        ...state,
        currentRoom: action.payload,
        rooms: [...state.rooms, action.payload],
      };
      
    case WEBSOCKET_ACTIONS.LEAVE_ROOM:
      logger.debug('Leaving room', { room: action.payload });
      return {
        ...state,
        currentRoom: null,
        rooms: state.rooms.filter(room => room !== action.payload),
      };
      
    case WEBSOCKET_ACTIONS.SET_ONLINE_USERS:
      logger.debug('Setting online users', { count: action.payload.length });
      return {
        ...state,
        onlineUsers: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.UPDATE_PRESENCE:
      logger.debug('Updating presence', { userId: action.payload.userId, status: action.payload.status });
      return {
        ...state,
        presence: {
          ...state.presence,
          [action.payload.userId]: action.payload,
        },
      };
      
    case WEBSOCKET_ACTIONS.SET_TYPING_STATUS:
      logger.debug('Setting typing status', { isTyping: action.payload.isTyping, users: action.payload.users });
      return {
        ...state,
        isTyping: action.payload.isTyping,
        typingUsers: action.payload.users,
        lastTypingTime: action.payload.timestamp,
      };
      
    case WEBSOCKET_ACTIONS.SET_TYPING_USERS:
      logger.debug('Setting typing users', { users: action.payload });
      return {
        ...state,
        typingUsers: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.SET_FEATURES:
      logger.debug('Setting WebSocket features', { features: action.payload });
      return {
        ...state,
        features: { ...state.features, ...action.payload },
      };
      
    case WEBSOCKET_ACTIONS.PING:
      logger.debug('WebSocket ping sent');
      return {
        ...state,
        lastPing: new Date().toISOString(),
      };
      
    case WEBSOCKET_ACTIONS.PONG:
      logger.debug('WebSocket pong received');
      return state;
      
    default:
      return state;
  }
};

// WebSocket message handlers
const messageHandlers = {
  // Chat messages
  chat_message: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.ADD_MESSAGE,
      payload: {
        type: 'chat',
        id: data.id,
        sender: data.sender,
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
        room: data.room,
      },
    });
  },
  
  // System notifications
  system_notification: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.ADD_MESSAGE,
      payload: {
        type: 'system',
        id: data.id,
        title: data.title,
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        level: data.level || 'info',
      },
    });
  },
  
  // Presence updates
  presence_update: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.UPDATE_PRESENCE,
      payload: {
        userId: data.userId,
        status: data.status,
        lastSeen: data.lastSeen,
        room: data.room,
      },
    });
  },
  
  // Typing indicators
  typing_start: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.SET_TYPING_USERS,
      payload: [...(new Set()), data.userId],
    });
  },
  
  typing_stop: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.SET_TYPING_USERS,
      payload: state.typingUsers.filter(userId => userId !== data.userId),
    });
  },
  
  // Room events
  room_joined: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.ADD_MESSAGE,
      payload: {
        type: 'system',
        content: `${data.username} joined the room`,
        timestamp: new Date().toISOString(),
        room: data.room,
      },
    });
  },
  
  room_left: (data, dispatch) => {
    dispatch({
      type: WEBSOCKET_ACTIONS.ADD_MESSAGE,
      payload: {
        type: 'system',
        content: `${data.username} left the room`,
        timestamp: new Date().toISOString(),
        room: data.room,
      },
    });
  },
  
  // Pong response
  pong: (dispatch) => {
    dispatch({ type: WEBSOCKET_ACTIONS.PONG });
  },
};

// Create context
const WebSocketContext = createContext(initialState);

// Context Provider Component
export const WebSocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(websocketReducer, initialState);
  const websocketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const auth = useSelector(state => state.auth);
  
  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!auth.isAuthenticated || !auth.token) {
      logger.warn('Cannot connect WebSocket: not authenticated');
      return;
    }
    
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'wss://localhost:8080';
    const ws = new WebSocket(`${wsUrl}?token=${auth.token}`);
    
    ws.onopen = () => {
      logger.info('WebSocket connection established');
      dispatch({ type: WEBSOCKET_ACTIONS.SET_WEBSOCKET, payload: ws });
      dispatch({ type: WEBSOCKET_ACTIONS.SET_STATUS, payload: CONNECTION_STATUS.CONNECTED });
      dispatch({ type: WEBSOCKET_ACTIONS.SET_CONNECTED, payload: true });
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Reset reconnect attempts
      dispatch({ type: 'SET_RECONNECT_ATTEMPTS', payload: 0 });
      
      // Start ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        }
      }, state.pingInterval);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = messageHandlers[data.type];
        
        if (handler) {
          handler(data, dispatch);
        } else {
          logger.warn('Unknown WebSocket message type', { type: data.type, data });
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error, message: event.data });
      }
    };
    
    ws.onclose = (event) => {
      logger.warn('WebSocket connection closed', { code: event.code, reason: event.reason });
      dispatch({ type: WEBSOCKET_ACTIONS.SET_CONNECTED, payload: false });
      dispatch({ type: WEBSOCKET_ACTIONS.SET_STATUS, payload: CONNECTION_STATUS.DISCONNECTED });
      
      // Clear intervals
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Attempt to reconnect if not a clean close
      if (!event.wasClean && state.reconnectAttempts < state.maxReconnectAttempts) {
        dispatch({ type: 'SET_RECONNECT_ATTEMPTS', payload: state.reconnectAttempts + 1 });
        
        reconnectTimeoutRef.current = setTimeout(() => {
          dispatch({ type: WEBSOCKET_ACTIONS.SET_STATUS, payload: CONNECTION_STATUS.RECONNECTING });
          connectWebSocket();
        }, state.reconnectInterval);
      }
    };
    
    ws.onerror = (error) => {
      logger.error('WebSocket error', { error });
      dispatch({
        type: WEBSOCKET_ACTIONS.SET_ERROR,
        payload: 'WebSocket connection failed',
      });
      dispatch({ type: WEBSOCKET_ACTIONS.SET_STATUS, payload: CONNECTION_STATUS.ERROR });
    };
    
    websocketRef.current = ws;
  }, [auth.isAuthenticated, auth.token]);
  
  // Auto-connect when authentication changes
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      connectWebSocket();
    } else if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, [auth.isAuthenticated, auth.token, connectWebSocket]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      websocketRef.current = null;
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);
  
  const contextValue = {
    ...state,
    
    // Actions
    sendMessage: (message, room = null) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        logger.error('Cannot send message: WebSocket not connected');
        return;
      }
      
      const messageData = {
        ...message,
        id: message.id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        room,
        sender: auth.user?.id || 'anonymous',
      };
      
      websocketRef.current.send(JSON.stringify(messageData));
      logger.debug('WebSocket message sent', { type: message.type, id: messageData.id });
    },
    
    joinRoom: (room) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'join_room',
          room,
        }));
      }
    },
    
    leaveRoom: (room) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'leave_room',
          room,
        }));
      }
    },
    
    sendTypingIndicator: (isTyping, room = null) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping,
          room,
          userId: auth.user?.id || 'anonymous',
        }));
      }
    },
    
    clearError: () => {
      dispatch({ type: WEBSOCKET_ACTIONS.CLEAR_ERROR });
    },
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook for using WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketContext;