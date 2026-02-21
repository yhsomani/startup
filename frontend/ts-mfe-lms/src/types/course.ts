export interface Course {
    id: string;
    instructorId: string;
    instructorName: string;
    title: string;
    subtitle: string;
    description: string;
    price: number;
    currency: string;
    thumbnailUrl: string;
    isPublished: boolean;
    createdAt: string;
    category?: string;
    level?: string;
    duration?: number;
    rating?: number;
    enrollmentCount?: number;
    enrolledCount?: number; // Alias or alternative naming
    sections?: Section[];
}

export interface Section {
    id: string;
    title: string;
    orderIndex: number;
    lessons: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'quiz' | 'challenge' | 'text';
    orderIndex: number;
    videoUrl?: string;
    duration?: number;
    content?: string;
}

export interface CourseListResponse {
    data: Course[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
