// User roles in the system
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'RECRUITER';

export interface RegistrationState {
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    company?: string;
    title?: string;
}

export interface AuthResponse {
    /** Primary field returned by the backend */
    token: string;
    /** Alias accepted for forward compat (some clients send this) */
    accessToken?: string;
    refreshToken: string;
    expiresIn?: number;
    sessionId?: string;
    user: User;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    ADMIN: ['*'], // Full access
    INSTRUCTOR: ['courses.create', 'courses.edit', 'courses.view', 'challenges.create', 'analytics.view'],
    STUDENT: ['courses.view', 'courses.enroll', 'challenges.submit', 'profile.view'],
    RECRUITER: ['candidates.search', 'candidates.view', 'profile.view']
};

// Check if role has permission
export const hasPermission = (role: UserRole, permission: string): boolean => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes('*') || permissions.includes(permission);
};
