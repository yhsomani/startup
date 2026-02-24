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
    userId: string;
    email: string;
    role: UserRole;
    accessToken: string;
    expiresIn: number;
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
