// Test Setup Configuration
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from '../__mocks__/server';

// MSW Server setup
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    cleanup();
    server.resetHandlers();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
});

afterAll(() => {
    server.close();
});

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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
} as any;

// Mock WebSocket
global.WebSocket = class WebSocket {
    constructor(public url: string) { }
    close() { }
    send() { }
    addEventListener() { }
    removeEventListener() { }
} as any;

// Mock scrollTo
window.scrollTo = vi.fn() as any;

// JSDOM FileList does not implement item() method, which is used by some testing libraries
if (typeof window !== 'undefined' && (window as any).FileList && !(window as any).FileList.prototype.item) {
    (window as any).FileList.prototype.item = function (this: any, index: number) {
        return this[index] || null;
    };
}

// Mock fetch if not already mocked by MSW
if (!global.fetch) {
    global.fetch = vi.fn();
}

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
