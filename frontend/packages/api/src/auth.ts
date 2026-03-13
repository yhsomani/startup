/**
 * Auth API Service
 * 
 * Handles authentication endpoints.
 * Updated to use /api/v1/auth/ prefix per backend changes.
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
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.put<User>('/auth/profile', data);
        return response.data;
    },

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('picture', file);
        const response = await api.post<{ url: string }>('/auth/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get user preferences
     */
    async getPreferences(): Promise<Record<string, unknown>> {
        const response = await api.get<Record<string, unknown>>('/auth/preferences');
        return response.data;
    },

    /**
     * Update user preferences
     */
    async updatePreferences(preferences: Record<string, unknown>): Promise<Record<string, unknown>> {
        const response = await api.put<Record<string, unknown>>('/auth/preferences', preferences);
        return response.data;
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<{ accessToken: string }> {
        const response = await api.post<{ accessToken: string }>('/auth/refresh-token');
        return response.data;
    },

    /**
     * Verify token validity
     */
    async verifyToken(): Promise<{ valid: boolean; user?: User }> {
        const response = await api.get<{ valid: boolean; user?: User }>('/auth/verify');
        return response.data;
    },

    /**
     * Logout (invalidate session)
     */
    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    /**
     * Change password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },
};

export default authApi;
