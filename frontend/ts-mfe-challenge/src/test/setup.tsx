import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from '../../__mocks__/server';

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

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
    Editor: vi.fn().mockImplementation((props) => (
        <textarea
            data-testid="monaco-editor"
            defaultValue={props.value}
            onChange={(e) => props.onChange?.(e.target.value)}
        />
    ))
}));
