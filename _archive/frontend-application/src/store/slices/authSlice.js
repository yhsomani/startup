/**
 * Authentication Slice
 * 
 * Redux Toolkit slice for authentication state management
 * Handles user login, logout, registration, and token management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Import API client
import { api } from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.auth.login({ email, password });
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error.message || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.auth.register(userData);
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error.message || 'Registration failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.auth.logout();
      
      if (response.data.success) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return { success: true };
      } else {
        return rejectWithValue(response.data.error.message || 'Logout failed');
      }
    } catch (error) {
      // Even if API fails, clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await api.auth.refreshToken({ refreshToken });
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error.message || 'Token refresh failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('authToken') || null,
  isAuthenticated: !!localStorage.getItem('authToken'),
  isLoading: false,
  error: null,
  registrationStatus: 'idle', // idle, loading, succeeded, failed
  loginStatus: 'idle',
  logoutStatus: 'idle',
  refreshTokenStatus: 'idle',
  passwordResetStatus: 'idle',
  emailVerificationStatus: 'idle',
  lastActivity: null,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    },
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    setPasswordResetStatus: (state, action) => {
      state.passwordResetStatus = action.payload;
    },
    setEmailVerificationStatus: (state, action) => {
      state.emailVerificationStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loginStatus = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginStatus = 'succeeded';
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('authToken', action.payload.token);
        localStorage.setItem('userData', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Registration
      .addCase(registerUser.pending, (state) => {
        state.registrationStatus = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.registrationStatus = 'succeeded';
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('authToken', action.payload.token);
        localStorage.setItem('userData', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registrationStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.logoutStatus = 'loading';
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutStatus = 'succeeded';
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Token refresh
      .addCase(refreshToken.pending, (state) => {
        state.refreshTokenStatus = 'loading';
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.refreshTokenStatus = 'succeeded';
        state.isLoading = false;
        state.token = action.payload.token;
        state.error = null;
        localStorage.setItem('authToken', action.payload.token);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.refreshTokenStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectLoginStatus = (state) => state.auth.loginStatus;
export const selectRegistrationStatus = (state) => state.auth.registrationStatus;
export const selectToken = (state) => state.auth.token;

export default authSlice.reducer;