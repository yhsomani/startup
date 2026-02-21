import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders, userEvent, App } from '../../../test/utils';
import { server } from '../../../__mocks__/server';
import { http, HttpResponse } from 'msw';

// Mock scrollTo
window.scrollTo = vi.fn() as any;

describe('Enrollment Flows', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('userId', '1');
        localStorage.setItem('accessToken', 'mock-token');
    });

    describe('Core App Rendering', () => {
        it('renders welcome message', async () => {
            renderWithProviders(<App />, { initialRoute: '/' });
            const heading = await screen.findByRole('heading', { name: /Welcome to TalentSphere/i });
            expect(heading).toBeInTheDocument();
        });

        it('navigation links are present', () => {
            renderWithProviders(<App />, { initialRoute: '/' });
            expect(screen.getByText('Courses')).toBeInTheDocument();
            expect(screen.getByText('Challenges')).toBeInTheDocument();
        });
    });

    it('should complete full enrollment flow: login → browse → enroll → view course', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />, { initialRoute: '/login' });

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
        });

        const nav = screen.getByRole('navigation');
        await user.click(within(nav).getByRole('link', { name: /^courses$/i }));

        await waitFor(() => {
            expect(screen.getByText(/browse courses/i)).toBeInTheDocument();
        });

        const courseCard = await screen.findByRole('heading', { name: /test course/i });
        await user.click(courseCard);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /test course/i })).toBeInTheDocument();
        });

        const enrollButton = screen.getByRole('button', { name: /enroll/i });
        await user.click(enrollButton);

        await waitFor(() => {
            expect(screen.getByTestId('message-banner')).toHaveTextContent(/enrolled successfully/i);
        });

        const startButton = screen.getByRole('button', { name: /start learning/i });
        await user.click(startButton);

        await waitFor(() => {
            expect(screen.getByText(/lesson 1/i)).toBeInTheDocument();
        });
    });

    it('should handle enrollment errors gracefully', async () => {
        server.use(
            http.post('http://localhost:8000/api/v1/enrollments', () => {
                return HttpResponse.json(
                    { error: { code: 'ALREADY_ENROLLED', message: 'Already enrolled in this course' } },
                    { status: 409 }
                );
            })
        );

        const user = userEvent.setup();
        renderWithProviders(<App />, { initialRoute: '/courses/course-1' });

        const enrollButton = await screen.findByRole('button', { name: /enroll/i });
        await user.click(enrollButton);

        await waitFor(() => {
            expect(screen.getByTestId('message-banner')).toHaveTextContent(/already enrolled/i);
        });
    });
});
