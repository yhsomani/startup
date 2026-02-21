import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from '../../__mocks__/lms-server';

// MSW Server setup
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    cleanup();
    server.resetHandlers();
    vi.clearAllMocks();
    localStorage.clear();
});

afterAll(() => {
    server.close();
});

// Mock react-player
vi.mock('react-player', () => ({
    default: vi.fn().mockImplementation(() => <div data-testid="react-player" />)
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
