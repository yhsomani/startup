/**
 * API Service
 * Handles API requests to the backend
 * Updated to use /api/v1/ prefix
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`);
    return response.json();
  },
  post: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  put: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }
};

export default api;
