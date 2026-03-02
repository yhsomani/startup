import { create } from 'zustand';
import axios from 'axios';

export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    instructorId: string;
    instructorName: string;
    category: string;
    level: string;
    duration: number;
    price: number;
    currency: string;
    rating: number;
    enrolledCount: number;
    thumbnailUrl: string;
    subtitle: string;
    isPublished: boolean;
    createdAt: string;
}

interface CoursesState {
    courses: Course[];
    loading: boolean;
    error: string | null;
    fetchCourses: () => Promise<void>;
    enrollCourse: (courseId: string) => Promise<void>;
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

// Fallback mock data shown when the LMS backend is unreachable
const MOCK_COURSES: Course[] = [
    {
        id: '1',
        title: 'Advanced React Patterns',
        subtitle: 'Master modern React',
        description: 'Learn advanced React patterns and best practices.',
        instructor: 'inst-1',
        instructorId: 'inst-1',
        instructorName: 'Sarah Drasner',
        category: 'programming',
        level: 'advanced',
        duration: 600,
        price: 49.99,
        currency: 'USD',
        rating: 4.8,
        enrolledCount: 1250,
        thumbnailUrl: 'https://placehold.co/600x400',
        isPublished: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Node.js Microservices',
        subtitle: 'Build scalable systems',
        description: 'Design and deploy microservices with Node.js and Docker.',
        instructor: 'inst-2',
        instructorId: 'inst-2',
        instructorName: 'Scott Moss',
        category: 'programming',
        level: 'intermediate',
        duration: 480,
        price: 39.99,
        currency: 'USD',
        rating: 4.6,
        enrolledCount: 850,
        thumbnailUrl: 'https://placehold.co/600x400',
        isPublished: true,
        createdAt: new Date().toISOString(),
    },
];

const getAuthHeaders = () => {
    if (typeof localStorage === 'undefined') return {};
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useCourses = create<CoursesState>((set) => ({
    courses: MOCK_COURSES,
    loading: false,
    error: null,

    fetchCourses: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE}/courses`, {
                headers: getAuthHeaders(),
                timeout: 8000,
            });
            const data = response.data;
            // Normalize: handle array, { courses: [] }, or { data: [] } response shapes
            const courses: Course[] = Array.isArray(data)
                ? data
                : data?.courses ?? data?.data ?? MOCK_COURSES;
            set({ courses, loading: false });
        } catch {
            // Fall back to mock data so the LMS UI is always usable during dev
            set({ courses: MOCK_COURSES, loading: false, error: null });
        }
    },

    enrollCourse: async (courseId: string) => {
        const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
        await axios.post(
            `${API_BASE}/enrollments`,
            { courseId, userId },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, timeout: 8000 }
        );
    },
}));
