import axios from 'axios';

const API_GATEWAY_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Unauthorized) and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_GATEWAY_URL}/api/v1/auth/refresh`, {
                        refreshToken
                    });

                    if (response.data?.token) {
                        localStorage.setItem('accessToken', response.data.token);
                        // Update the authorization header for the retried request
                        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh token failed or is expired -> perform logout
                console.error("Session expired. Please log in again.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                // Redirect to login (best handled via Context, but forcing reload works as a fallback)
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
