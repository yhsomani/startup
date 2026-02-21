/**
 * Messages Slice
 * 
 * Redux Toolkit slice for messaging and chat state management
 * Handles conversations, messages, notifications, and real-time communication
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/messages/conversations?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, type = 'text', attachments = [] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          type,
          attachments
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markMessageAsRead',
  async ({ messageId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to mark message as read');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark message as read');
    }
  }
);

// Initial state
const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isSending: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  messagePagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  typing: {
    conversationId: null,
    users: [],
    isTyping: false,
  },
  onlineUsers: [],
  websocketConnected: false,
};

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
        status: 'sent'
      });
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload };
      }
    },
    setTypingStatus: (state, action) => {
      state.typing = {
        conversationId: action.payload.conversationId,
        users: action.payload.users || [],
        isTyping: action.payload.isTyping || false,
        lastTypingTime: action.payload.isTyping ? new Date().toISOString() : state.typing.lastTypingTime
      };
    },
    clearTypingStatus: (state) => {
      state.typing = initialState.typing;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setWebsocketConnected: (state, action) => {
      state.websocketConnected = action.payload;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, state.unreadCount + action.payload);
    },
    markConversationAsRead: (state, action) => {
      if (state.currentConversation && state.currentConversation.id === action.payload) {
        const unreadMessages = state.messages.filter(msg => 
          msg.status === 'delivered' && msg.senderId !== 'current_user'
        );
        const unreadCount = unreadMessages.length;
        state.unreadCount = Math.max(0, state.unreadCount - unreadCount);
        
        // Update message status
        unreadMessages.forEach(msg => {
          msg.status = 'read';
          msg.readAt = new Date().toISOString();
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.conversations || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages || [];
        state.messagePagination = action.payload.pagination || initialState.messagePagination;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        state.messages.push({
          ...action.payload.message,
          timestamp: new Date().toISOString(),
          status: 'sent'
        });
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const index = state.messages.findIndex(msg => msg.id === action.meta.arg.messageId);
        if (index !== -1) {
          state.messages[index] = {
            ...state.messages[index],
            status: 'read',
            readAt: new Date().toISOString()
          };
          
          // Update unread count
          const wasUnread = state.messages[index].status === 'delivered';
          if (wasUnread && state.messages[index].senderId !== 'current_user') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectConversations = (state) => state.messages.conversations;
export const selectCurrentConversation = (state) => state.messages.currentConversation;
export const selectMessages = (state) => state.messages.messages;
export const selectUnreadCount = (state) => state.messages.unreadCount;
export const selectMessagesLoading = (state) => state.messages.isLoading;
export const selectIsSending = (state) => state.messages.isSending;
export const selectTypingStatus = (state) => state.messages.typing;
export const selectOnlineUsers = (state) => state.messages.onlineUsers;
export const selectWebsocketConnected = (state) => state.messages.websocketConnected;

export default messagesSlice.reducer;