/**
 * TalentSphere API Client
 * Centralized API integration layer with authentication, error handling, and caching
 */

import axios from 'axios';
import { createLogger } from '../logger';

const logger = createLogger('APIClient');

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
    });
    
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    logger.error('API Error', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message,
      data: error.response?.data,
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Handle permission errors
      return Promise.reject(error);
    }
    
    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      // Handle server errors with retry logic
      if (!originalRequest._retry && originalRequest._retry !== 0) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        // Retry up to 3 times
        if (originalRequest._retryCount <= 3) {
          // Exponential backoff
          const delay = Math.pow(2, originalRequest._retryCount) * 1000;
          return new Promise((resolve) => {
            setTimeout(() => resolve(apiClient(originalRequest)), delay);
          });
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Utility functions
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// API Services
export const api = {
  // Authentication
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
    verifyToken: () => apiClient.get('/auth/verify'),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (data) => apiClient.post('/auth/reset-password', data),
    changePassword: (data) => apiClient.post('/auth/change-password', data),
  },

  // User Profile
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data) => apiClient.put('/users/profile', data),
    uploadAvatar: (formData) => apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteAvatar: () => apiClient.delete('/users/avatar'),
    getSettings: () => apiClient.get('/users/settings'),
    updateSettings: (settings) => apiClient.put('/users/settings', settings),
    deleteAccount: () => apiClient.delete('/users/account'),
  },

  // Jobs
  jobs: {
    getJobs: (params) => apiClient.get('/jobs', { params }),
    getJob: (id) => apiClient.get(`/jobs/${id}`),
    createJob: (jobData) => apiClient.post('/jobs', jobData),
    updateJob: (id, jobData) => apiClient.put(`/jobs/${id}`, jobData),
    deleteJob: (id) => apiClient.delete(`/jobs/${id}`),
    applyToJob: (id, applicationData) => apiClient.post(`/jobs/${id}/apply`, applicationData),
    saveJob: (id) => apiClient.post(`/jobs/${id}/save`),
    unsaveJob: (id) => apiClient.delete(`/jobs/${id}/save`),
    getSavedJobs: () => apiClient.get('/jobs/saved'),
    getJobApplications: (id) => apiClient.get(`/jobs/${id}/applications`),
    searchJobs: (query) => apiClient.get('/jobs/search', { params: { q: query } }),
    getRecommendedJobs: () => apiClient.get('/jobs/recommended'),
  },

  // Companies
  companies: {
    getCompanies: (params) => apiClient.get('/companies', { params }),
    getCompany: (id) => apiClient.get(`/companies/${id}`),
    followCompany: (id) => apiClient.post(`/companies/${id}/follow`),
    unfollowCompany: (id) => apiClient.delete(`/companies/${id}/follow`),
    getFollowingCompanies: () => apiClient.get('/companies/following'),
    getCompanyJobs: (id, params) => apiClient.get(`/companies/${id}/jobs`, { params }),
    getCompanyReviews: (id, params) => apiClient.get(`/companies/${id}/reviews`, { params }),
    createCompanyReview: (id, review) => apiClient.post(`/companies/${id}/reviews`, review),
  },

  // Applications
  applications: {
    getApplications: (params) => apiClient.get('/applications', { params }),
    getApplication: (id) => apiClient.get(`/applications/${id}`),
    withdrawApplication: (id) => apiClient.post(`/applications/${id}/withdraw`),
    updateApplication: (id, data) => apiClient.put(`/applications/${id}`, data),
    getApplicationHistory: () => apiClient.get('/applications/history'),
  },

  // Network
  network: {
    getConnections: (params) => apiClient.get('/network/connections', { params }),
    getConnectionRequests: () => apiClient.get('/network/requests'),
    sendConnectionRequest: (userId, message) => apiClient.post('/network/requests', { userId, message }),
    acceptConnectionRequest: (id) => apiClient.post(`/network/requests/${id}/accept`),
    declineConnectionRequest: (id) => apiClient.post(`/network/requests/${id}/decline`),
    removeConnection: (userId) => apiClient.delete(`/network/connections/${userId}`),
    getSuggestedConnections: () => apiClient.get('/network/suggestions'),
  },

  // Messages
  messages: {
    getConversations: (params) => apiClient.get('/messages/conversations', { params }),
    getConversation: (id, params) => apiClient.get(`/messages/conversations/${id}`, { params }),
    sendMessage: (conversationId, message) => apiClient.post(`/messages/conversations/${conversationId}`, { message }),
    markAsRead: (conversationId) => apiClient.post(`/messages/conversations/${conversationId}/read`),
    deleteMessage: (messageId) => apiClient.delete(`/messages/${messageId}`),
    getUnreadCount: () => apiClient.get('/messages/unread-count'),
  },

  // Notifications
  notifications: {
    getNotifications: (params) => apiClient.get('/notifications', { params }),
    markAsRead: (id) => apiClient.post(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.post('/notifications/read-all'),
    deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
    updatePreferences: (preferences) => apiClient.put('/notifications/preferences', preferences),
    getPreferences: () => apiClient.get('/notifications/preferences'),
  },

  // Analytics
  analytics: {
    getDashboard: () => apiClient.get('/analytics/dashboard'),
    getProfileViews: (params) => apiClient.get('/analytics/profile-views', { params }),
    getApplicationStats: (params) => apiClient.get('/analytics/applications', { params }),
    getSearchAppearances: (params) => apiClient.get('/analytics/search-appearances', { params }),
    getNetworkGrowth: (params) => apiClient.get('/analytics/network-growth', { params }),
  },

  // Search
  search: {
    global: (query, params) => apiClient.get('/search', { params: { q: query, ...params } }),
    users: (query, params) => apiClient.get('/search/users', { params: { q: query, ...params } }),
    jobs: (query, params) => apiClient.get('/search/jobs', { params: { q: query, ...params } }),
    companies: (query, params) => apiClient.get('/search/companies', { params: { q: query, ...params } }),
  },

  // File Upload
  upload: {
    uploadResume: (formData) => apiClient.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadProfilePicture: (formData) => apiClient.post('/upload/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadPortfolio: (formData) => apiClient.post('/upload/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // Utility endpoints
  utils: {
    health: () => apiClient.get('/health'),
    metrics: () => apiClient.get('/metrics'),
    version: () => apiClient.get('/version'),
    config: () => apiClient.get('/config'),
  },
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data?.message || 'Bad request';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 409:
        return data?.message || 'Conflict';
      case 422:
        return data?.message || 'Validation error';
      case 429:
        return 'Too many requests';
      case 500:
        return 'Server error';
      case 503:
        return 'Service unavailable';
      default:
        return data?.message || `Error ${status}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Cancel token utility
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Check if request was cancelled
export const isCancel = axios.isCancel;

export default api;