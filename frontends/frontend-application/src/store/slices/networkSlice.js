/**
 * Network Slice
 * 
 * Redux Toolkit slice for network state management
 * Handles online/offline status, connectivity issues, and API request errors
 */

import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  isOnline: navigator.onLine,
  connectionType: 'unknown',
  lastOnlineTime: new Date().toISOString(),
  lastOfflineTime: null,
  apiErrors: [],
  retryQueue: [],
  connectionAttempts: 0,
  maxRetries: 3,
  syncStatus: 'idle', // idle, syncing, synced, failed
  lastSyncTime: null,
};

// Slice
const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
      state.lastOnlineTime = action.payload ? new Date().toISOString() : state.lastOnlineTime;
      state.lastOfflineTime = !action.payload ? new Date().toISOString() : state.lastOfflineTime;
      
      if (!action.payload && state.connectionAttempts < state.maxRetries) {
        state.connectionAttempts += 1;
      } else if (action.payload) {
        state.connectionAttempts = 0;
      }
    },
    
    setConnectionType: (state, action) => {
      state.connectionType = action.payload;
    },
    
    addApiError: (state, action) => {
      const error = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: action.payload.message,
        status: action.payload.status,
        url: action.payload.url,
        method: action.payload.method,
        retryCount: 1
      };
      
      state.apiErrors.push(error);
      
      // Keep only last 50 errors
      if (state.apiErrors.length > 50) {
        state.apiErrors = state.apiErrors.slice(-50);
      }
    },
    
    clearApiErrors: (state) => {
      state.apiErrors = [];
    },
    
    removeApiError: (state, action) => {
      state.apiErrors = state.apiErrors.filter(error => error.id !== action.payload);
    },
    
    addToRetryQueue: (state, action) => {
      const retryItem = {
        id: Date.now().toString(),
        ...action.payload,
        retryCount: 1,
        addedAt: new Date().toISOString()
      };
      
      state.retryQueue.push(retryItem);
      
      // Keep only last 20 items in retry queue
      if (state.retryQueue.length > 20) {
        state.retryQueue = state.retryQueue.slice(-20);
      }
    },
    
    removeFromRetryQueue: (state, action) => {
      state.retryQueue = state.retryQueue.filter(item => item.id !== action.payload);
    },
    
    clearRetryQueue: (state) => {
      state.retryQueue = [];
    },
    
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
      if (action.payload === 'synced') {
        state.lastSyncTime = new Date().toISOString();
      }
    },
    
    incrementRetryCount: (state, action) => {
      const item = state.retryQueue.find(item => item.id === action.payload);
      if (item) {
        item.retryCount += 1;
        item.lastRetryTime = new Date().toISOString();
      }
    },
    
    resetConnectionAttempts: (state) => {
      state.connectionAttempts = 0;
    },
  },
});

// Selectors
export const selectIsOnline = (state) => state.network.isOnline;
export const selectConnectionType = (state) => state.network.connectionType;
export const selectApiErrors = (state) => state.network.apiErrors;
export const selectRetryQueue = (state) => state.network.retryQueue;
export const selectSyncStatus = (state) => state.network.syncStatus;
export const selectConnectionAttempts = (state) => state.network.connectionAttempts;

export default networkSlice.reducer;