/**
 * Auth API Service
 * 
 * Handles authentication endpoints.
 */
import api from './http';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from './types';

export const authApi = {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Register a new user
     */
    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', credentials);
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<{ accessToken: string }> {
        const response = await api.post<{ accessToken: string }>('/auth/refresh');
        return response.data;
    },

    /**
     * Change password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },
};

export default authApi;
