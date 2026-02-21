/**
 * Notifications Slice
 * 
 * Redux Toolkit slice for notification state management
 * Handles push notifications, email notifications, and notification preferences
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, type = null, read = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type,
        read
      });
      
      const response = await fetch(`/api/v1/notifications?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch notifications');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to mark notification as read');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to mark all notifications as read');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to update notification preferences');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update notification preferences');
    }
  }
);

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    email: {
      enabled: true,
      types: ['job_application', 'profile_update', 'system', 'message'],
      frequency: 'immediate'
    },
    push: {
      enabled: true,
      types: ['job_application', 'profile_update', 'system', 'message'],
      frequency: 'immediate'
    },
    sms: {
      enabled: false,
      types: ['system'],
      frequency: 'never'
    },
    inApp: {
      enabled: true,
      types: ['job_application', 'profile_update', 'system', 'message'],
      frequency: 'immediate'
    },
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  isUpdating: false,
  error: null,
  filter: {
    type: 'all',
    read: 'all',
    dateRange: null,
  },
  lastFetched: null,
};

// Slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastFetched = null;
    },
    addNotification: (state, action) => {
      // For real-time notifications from WebSocket
      state.notifications.unshift({
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: false
      });
      
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
      
      state.lastFetched = new Date().toISOString();
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = initialState.filter;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.unreadCount = action.payload.unreadCount || 0;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.notifications.findIndex(n => n.id === action.meta.arg.notificationId);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Mark all as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.notifications.forEach(notification => {
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Update preferences
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.preferences = { ...state.preferences, ...action.payload };
        state.error = null;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationPreferences = (state) => state.notifications.preferences;
export const selectNotificationLoading = (state) => state.notifications.isLoading;
export const selectNotificationFilter = (state) => state.notifications.filter;
export const selectNotificationPagination = (state) => state.notifications.pagination;
export const selectNotificationError = (state) => state.notifications.error;

export default notificationsSlice.reducer;