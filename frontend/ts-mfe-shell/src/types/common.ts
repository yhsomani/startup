/**
 * Common types and utilities
 */

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'RECRUITER';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePictureUrl?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        pages: number;
        per_page: number;
        total: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error
    );
}

/**
 * Type guard to check if error has message property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    );
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
    if (hasErrorMessage(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
}
