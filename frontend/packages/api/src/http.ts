/**
 * TalentSphere API Client
 * 
 * Single source of truth for all HTTP requests.
 * Handles authentication, error normalization, and request configuration.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Normalized API error structure
export interface ApiError {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

// Token accessor function - will be set by auth store
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => { };

/**
 * Configure the auth token accessor
 * Called by the auth store during initialization
 */
export const configureAuth = (
    tokenAccessor: () => string | null,
    unauthorizedHandler: () => void
) => {
    getToken = tokenAccessor;
    onUnauthorized = unauthorizedHandler;
};

const getBaseUrl = () => {
    if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
        return process.env.VITE_API_BASE_URL;
    }
    try {
        return (import.meta as any).env?.VITE_API_BASE_URL;
    } catch {
        return undefined;
    }
};

/**
 * Create the axios instance with base configuration
 */
export const api: AxiosInstance = axios.create({
    baseURL: getBaseUrl() || '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor - adds auth token to all requests
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor - normalizes errors
 */
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
        // Handle network errors
        if (!error.response) {
            const apiError: ApiError = {
                status: 0,
                code: 'NETWORK_ERROR',
                message: 'Unable to connect to server. Please check your internet connection.',
            };
            throw apiError;
        }

        const { status, data } = error.response;

        // Handle 401 - trigger logout
        if (status === 401) {
            onUnauthorized();
        }

        // Normalize error response
        const apiError: ApiError = {
            status,
            code: data?.error?.code ?? `HTTP_${status}`,
            message: data?.error?.message ?? getDefaultMessage(status),
            details: data as Record<string, unknown>,
        };

        throw apiError;
    }
);

/**
 * Default error messages by HTTP status
 */
function getDefaultMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Please log in to continue.';
        case 403:
            return 'You do not have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 409:
            return 'This action conflicts with an existing resource.';
        case 422:
            return 'The provided data is invalid.';
        case 429:
            return 'Too many requests. Please wait a moment.';
        case 500:
            return 'An unexpected server error occurred.';
        case 502:
        case 503:
        case 504:
            return 'The service is temporarily unavailable. Please try again.';
        default:
            return 'An unexpected error occurred.';
    }
}

export default api;
