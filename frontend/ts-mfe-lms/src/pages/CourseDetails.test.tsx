
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseDetails from './CourseDetails';
import api from '../services/api';
import { progressService } from '../services/progressService';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock API and services
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
    }
}));

vi.mock('../services/progressService', () => ({
    progressService: {
        getEnrollment: vi.fn(),
        enroll: vi.fn(),
    }
}));

const mockCourse = {
    id: "123",
    title: "Test Course",
    subtitle: "Test Subtitle",
    price: 99.99,
    currency: "$",
    description: "Test Description",
    instructorName: "John Doe",
    sections: [
        {
            id: "s1",
            title: "Getting Started",
            lessons: [
                { id: "l1", title: "Intro", type: "video", duration: 300 }
            ]
        }
    ]
};

describe('CourseDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock returns
        (api.get as any).mockResolvedValue({ data: mockCourse });
        (progressService.getEnrollment as any).mockResolvedValue(null);
    });

    it('renders loading state initially', () => {
        render(
            <MemoryRouter initialEntries={['/courses/123']}>
                <Routes>
                    <Route path="/courses/:courseId" element={<CourseDetails />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/Loading course/i)).toBeInTheDocument();
    });

    it('renders course details after fetch', async () => {
        render(
            <MemoryRouter initialEntries={['/courses/123']}>
                <Routes>
                    <Route path="/courses/:courseId" element={<CourseDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Test Course")).toBeInTheDocument();
            expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Intro")).toBeInTheDocument();
        });
    });

    it('shows Enroll Now button when not enrolled', async () => {
        render(
            <MemoryRouter initialEntries={['/courses/123']}>
                <Routes>
                    <Route path="/courses/:courseId" element={<CourseDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Enroll Now")).toBeInTheDocument();
        });
    });

    it('handles enrollment', async () => {
        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('user1');
        (progressService.enroll as any).mockResolvedValue({});

        render(
            <MemoryRouter initialEntries={['/courses/123']}>
                <Routes>
                    <Route path="/courses/:courseId" element={<CourseDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Enroll Now")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Enroll Now"));

        await waitFor(() => {
            expect(progressService.enroll).toHaveBeenCalledWith('123', 'user1');
            // After enrollment, it should ideally switch to "Continue Learning", 
            // but we might need to wait for state update.
            // But let's at least check the service was called.
        });
    });
});
