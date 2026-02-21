import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent, App } from '../../../test/utils';

// Mock scrollTo
window.scrollTo = vi.fn() as any;

describe('Challenge Flows', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('userId', '1');
        localStorage.setItem('accessToken', 'mock-token');
    });

    it('should complete full challenge flow', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />, { initialRoute: '/challenges' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: /Challenges/i })).toBeInTheDocument();
        });

        const challenge = await screen.findByText('Titanic Survival Prediction');
        await user.click(challenge);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /problem statement/i })).toBeInTheDocument();
        });

        const file = new File(['test'], 'submission.csv', { type: 'text/csv' });
        const fileInput = screen.getByLabelText(/upload solution/i);

        Object.defineProperty(fileInput, 'files', {
            value: [file],
            configurable: true
        });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/submission.csv/i)).toBeInTheDocument();
        });

        const submitButton = await screen.findByRole('button', { name: /submit/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/submission queued/i)).toBeInTheDocument();
        });
    });
});
