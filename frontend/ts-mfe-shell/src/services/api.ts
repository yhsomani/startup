import axios from 'axios';

// Use import.meta.env for Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 error and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken
                    });

                    const newToken = data.token || data.accessToken;
                    if (newToken) {
                        localStorage.setItem('accessToken', newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api.request(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('role');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
