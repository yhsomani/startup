import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, App } from '../../../test/utils';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
    const socketMock = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        connected: true,
    };
    return {
        io: vi.fn(() => socketMock),
        default: vi.fn(() => socketMock),
    };
});

describe('Notification Flows', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('userId', '1');
        localStorage.setItem('accessToken', 'mock-token');
    });

    it('should handle progress updates', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />, { initialRoute: '/courses/course-1/learn' });

        await waitFor(() => {
            expect(screen.getByText(/0% complete/i)).toBeInTheDocument();
        });

        const completeButton = screen.getByRole('button', { name: /mark complete/i });
        await user.click(completeButton);

        await waitFor(() => {
            expect(screen.getByText(/50% complete/i)).toBeInTheDocument();
        });
    });
});
