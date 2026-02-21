import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/auth';
import api from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (allowedRoles: UserRole[]) => boolean;
    hasAnyRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role') as UserRole | null;

        if (token && userId && role) {
            setUser({ id: userId, email: email || '', role });
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        const response = await api.post('/auth/login', { email, password });
        // Backend returns 'token', not 'accessToken'
        const token = response.data.token || response.data.accessToken;
        const userId = response.data.user?.id;
        const role = response.data.user?.role;

        localStorage.setItem('accessToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);

        setUser({ id: userId, email, role });
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        setUser(null);
    };

    // Check if user has at least one of the allowed roles
    const hasRole = (allowedRoles: UserRole[]): boolean => {
        if (!user) return false;
        // ADMIN has access to everything
        if (user.role === 'ADMIN') return true;
        return allowedRoles.includes(user.role);
    };

    // Alias for hasRole
    const hasAnyRole = hasRole;

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        hasAnyRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
