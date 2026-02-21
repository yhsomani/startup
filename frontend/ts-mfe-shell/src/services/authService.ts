import api from './api';

// TypeScript interfaces for type safety
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    firstName?: string;
    lastName?: string;
}

export interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    // Backend returns 'token', store as 'accessToken' for consistency
    const token = response.data.token || (response.data as any).accessToken;
    if (token) {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', response.data.refreshToken || '');
        localStorage.setItem('userId', response.data.user?.id || '');
        localStorage.setItem('role', response.data.user?.role || '');
    }
    return response.data;
};

export const logout = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
};

export const getCurrentUser = (): User | null => {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (!userId) return null;

    return {
        id: userId,
        email: email || '',
        role: role || 'STUDENT'
    };
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('accessToken');
};
