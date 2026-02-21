/**
 * TalentSphere WebSocket Client
 * Real-time communication service
 */

import { io } from 'socket.io-client';
import { createLogger } from '../logger';

const logger = createLogger('WebSocketClient');

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  // Initialize WebSocket connection
  connect(token) {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8000';
      
      this.socket = io(wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
      });

      this.setupEventListeners();
      
      logger.info('WebSocket connection initialized');
    } catch (error) {
      logger.error('WebSocket connection error:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('WebSocket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.warn('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      logger.error('WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      logger.info('WebSocket authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('unauthorized', (error) => {
      logger.error('WebSocket unauthorized:', error);
      this.emit('unauthorized', error);
    });

    // Message events
    this.socket.on('message', (data) => {
      logger.debug('WebSocket message received:', data);
      this.emit('message', data);
    });

    this.socket.on('new_message', (data) => {
      logger.info('New message received:', data);
      this.emit('new_message', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      logger.info('Notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('application_update', (data) => {
      logger.info('Application update received:', data);
      this.emit('application_update', data);
    });

    this.socket.on('profile_view', (data) => {
      logger.info('Profile view notification:', data);
      this.emit('profile_view', data);
    });

    // Real-time presence
    this.socket.on('user_online', (data) => {
      logger.debug('User online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      logger.debug('User offline:', data);
      this.emit('user_offline', data);
    });

    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('stop_typing', (data) => {
      this.emit('stop_typing', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Attempt reconnection
  attemptReconnection() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
      logger.info('WebSocket disconnected manually');
    }
  }

  // Send message
  sendMessage(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      logger.debug(`WebSocket message sent: ${event}`, data);
    } else {
      logger.warn('WebSocket not connected, cannot send message');
    }
  }

  // Join room
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { room });
      logger.info(`Joined room: ${room}`);
    }
  }

  // Leave room
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { room });
      logger.info(`Left room: ${room}`);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('WebSocket event listener error:', error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Send typing indicator
  sendTyping(conversationId) {
    this.sendMessage('typing', { conversationId });
  }

  // Stop typing indicator
  stopTyping(conversationId) {
    this.sendMessage('stop_typing', { conversationId });
  }

  // Send read receipt
  sendReadReceipt(messageId) {
    this.sendMessage('message_read', { messageId });
  }

  // Join conversation room
  joinConversation(conversationId) {
    this.joinRoom(`conversation_${conversationId}`);
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    this.leaveRoom(`conversation_${conversationId}`);
  }

  // Send presence update
  sendPresence(status) {
    this.sendMessage('presence_update', { status });
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;