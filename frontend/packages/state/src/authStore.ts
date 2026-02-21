/**
 * Auth Store
 * 
 * Global authentication state with Zustand.
 * Handles JWT token, user info, login/logout.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
}

interface AuthState {
    // State
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (token: string, user: AuthUser) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    getToken: () => string | null;
}

/**
 * Auth store with persistence
 * Token and user info are persisted to localStorage
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,

            // Set auth after successful login
            setAuth: (token, user) =>
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            // Clear auth on logout
            logout: () =>
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),

            // Set loading state
            setLoading: (loading) => set({ isLoading: loading }),

            // Get token for API interceptor
            getToken: () => get().token,
        }),
        {
            name: 'talentsphere-auth',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

/**
 * Hook to check if user has specific role
 */
export const useHasRole = (requiredRole: UserRole): boolean => {
    const user = useAuthStore((state) => state.user);
    if (!user) return false;

    // Admin can access everything
    if (user.role === 'ADMIN') return true;

    // Instructor can access instructor and student routes
    if (user.role === 'INSTRUCTOR' && requiredRole === 'STUDENT') return true;

    return user.role === requiredRole;
};

/**
 * Hook to check if user is instructor or admin
 */
export const useIsInstructor = (): boolean => {
    const user = useAuthStore((state) => state.user);
    return user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
};

/**
 * Hook to check if user is admin
 */
export const useIsAdmin = (): boolean => {
    const user = useAuthStore((state) => state.user);
    return user?.role === 'ADMIN';
};

export default useAuthStore;
