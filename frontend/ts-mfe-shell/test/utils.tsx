// Test Utilities and Custom Render
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
// import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock auth context
interface AuthContextValue {
    user: { id: string; email: string; role: string } | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

// Mock auth context removed as unused

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialRoute?: string;
    authValue?: Partial<AuthContextValue>;
}

export function renderWithProviders(
    ui: ReactElement,
    {
        initialRoute = '/',
        authValue = {},
        ...renderOptions
    }: CustomRenderOptions = {}
) {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        return (
            <AuthProvider>
                <MemoryRouter initialEntries={[initialRoute]}>
                    {children}
                </MemoryRouter>
            </AuthProvider>
        );
    };

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
}

// Wait for loading to complete
export const waitForLoadingToFinish = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

// Create mock user
export const createMockUser = (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'STUDENT',
    ...overrides,
});

// Create mock course
export const createMockCourse = (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Course',
    subtitle: 'Test Subtitle',
    description: 'Test Description',
    price: 49.99,
    currency: 'USD',
    isPublished: true,
    instructorId: '123e4567-e89b-12d3-a456-426614174002',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    sections: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
});

// Create mock enrollment
export const createMockEnrollment = (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174003',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    courseId: '123e4567-e89b-12d3-a456-426614174001',
    courseTitle: 'Test Course',
    progressPercentage: 0,
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
});

// Create mock challenge
export const createMockChallenge = (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174004',
    title: 'Test Challenge',
    description: 'Test challenge description',
    difficulty: 'medium',
    evaluationMetric: 'accuracy',
    totalSubmissions: 100,
    successRate: 0.75,
    ...overrides,
});

// Create mock notification
export const createMockNotification = (overrides = {}) => ({
    type: 'course.published',
    title: 'New Course Available',
    message: 'A new course has been published',
    data: {},
    timestamp: new Date().toISOString(),
    priority: 'normal',
    ...overrides,
});

// Simulate network delay
export const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Simulate API error
export const createApiError = (
    status: number,
    message: string,
    code?: string
) => ({
    response: {
        status,
        data: {
            error: {
                code: code || `ERROR_${status}`,
                message,
                timestamp: new Date().toISOString(),
            },
        },
    },
});

// File upload helper
export const createMockFile = (
    name = 'test.csv',
    size = 1024,
    type = 'text/csv'
) => {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
};

// Mock localStorage
export const mockLocalStorage = () => {
    const store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            Object.keys(store).forEach((key) => delete store[key]);
        },
    };
};

// Mock window.location
export const mockLocation = (href: string) => {
    delete (window as any).location;
    window.location = { href } as any;
};

// Create mock FormData
export const createMockFormData = (data: Record<string, any>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
    });
    return formData;
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export App component for integration tests
export { default as App } from '../src/TestApp';
