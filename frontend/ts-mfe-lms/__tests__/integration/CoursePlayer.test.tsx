import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CoursePlayer from '../../src/pages/CoursePlayer';

describe('CoursePlayer Integration', () => {
    beforeEach(() => {
        localStorage.setItem('userId', 'user-123');
        localStorage.setItem('accessToken', 'mock-token');
    });

    it('loads course content and displays lessons', async () => {
        render(
            <MemoryRouter initialEntries={['/courses/course-123/learn']}>
                <Routes>
                    <Route path="/courses/:courseId/learn" element={<CoursePlayer />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading player/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Mastering Vitest')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /Vitest Intro/i, level: 1 })).toBeInTheDocument();
            expect(screen.getByText('Setup Guide')).toBeInTheDocument();
        });
    });

    it('marks a lesson as complete', async () => {
        render(
            <MemoryRouter initialEntries={['/courses/course-123/learn']}>
                <Routes>
                    <Route path="/courses/:courseId/learn" element={<CoursePlayer />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Vitest Intro/i, level: 1 })).toBeInTheDocument();
        });

        const completeButton = screen.getByRole('button', { name: /Mark as Complete/i });
        fireEvent.click(completeButton);

        // Verification: The button should change and be disabled
        await waitFor(() => {
            const buttonAfter = screen.getByRole('button', { name: /Completed/i });
            expect(buttonAfter).toBeInTheDocument();
            expect(buttonAfter).toBeDisabled();
        }, { timeout: 3000 });
    });
});
