import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChallengeDetails from '../../src/pages/ChallengeDetails';
import { vi } from 'vitest';
import api from '../../src/services/api';

vi.mock('../../src/components/CollaborativeEditor', () => ({
    CollaborativeEditor: () => <div data-testid="monaco-editor">Mocked Editor</div>
}));

describe('ChallengeDetails Integration', () => {
    beforeEach(() => {
        localStorage.setItem('accessToken', 'mock-token');
        vi.spyOn(api, 'post').mockResolvedValue({
            data: { submissionId: 'sub123', status: 'pending' }
        });
    });

    it('loads challenge details and shows IDE', async () => {
        render(
            <MemoryRouter initialEntries={['/c1']}>
                <Routes>
                    <Route path="/:challengeId" element={<ChallengeDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Python Basics')).toBeInTheDocument();
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });

    it('submits code from logic', async () => {
        render(
            <MemoryRouter initialEntries={['/c1']}>
                <Routes>
                    <Route path="/:challengeId" element={<ChallengeDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        const file = new File(['print("hello")'], 'solution.py', { type: 'text/x-python' });
        const fileInput = screen.getByTestId('file-input');
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitButton = screen.getByRole('button', { name: /submit file/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Status:/i)).toBeInTheDocument();
            expect(screen.getByText(/PENDING/)).toBeInTheDocument();
        });
    });
});
