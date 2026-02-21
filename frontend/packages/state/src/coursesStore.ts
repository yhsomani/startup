import { create } from 'zustand';

export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    instructorId: string; // Added for compatibility
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

// Mock data for now
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
    }
];

export const useCourses = create<CoursesState>((set) => ({
    courses: MOCK_COURSES,
    loading: false,
    error: null,
    fetchCourses: async () => {
        set({ loading: true });
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            set({ courses: MOCK_COURSES, loading: false });
        } catch (err) {
            set({ error: 'Failed to fetch courses', loading: false });
        }
    },
    enrollCourse: async (courseId: string) => {
        console.log(`Enrolling in course ${courseId}`);
        // Implement enrollment logic here
    }
}));
