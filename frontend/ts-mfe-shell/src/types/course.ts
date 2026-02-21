/**
 * Course-related TypeScript types
 * Replaces usage of `any` throughout the frontend
 */

export interface Instructor {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

export interface CourseSkill {
    id: string;
    name: string;
    createdAt?: string;
}

export interface Lesson {
    id: string;
    type: 'video' | 'quiz' | 'challenge' | 'text';
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    orderIndex: number;
    challengeId?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface Section {
    id: string;
    title: string;
    orderIndex: number;
    isActive: boolean;
    lessons: Lesson[];
    createdAt?: string;
}

export interface Course {
    id: string;
    instructorId: string;
    instructorName?: string;
    title: string;
    subtitle?: string;
    description?: string;
    price: number;
    currency: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    isPublished: boolean;
    isActive: boolean;
    sections?: Section[];
    skills?: CourseSkill[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CoursePreview {
    id: string;
    instructorId: string;
    instructorName?: string;
    title: string;
    subtitle?: string;
    description?: string;
    price: number;
    currency: string;
    thumbnailUrl?: string;
    isPublished: boolean;
    createdAt?: string;
}

export interface Pagination {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface CourseListResponse {
    courses: CoursePreview[];
    pagination: Pagination;
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    progressPercentage: number;
    enrolledAt: string;
    completedAt?: string;
    lastAccessedAt?: string;
    isActive: boolean;
}

export interface LessonProgress {
    id: string;
    enrollmentId: string;
    lessonId: string;
    completed: boolean;
    watchedSeconds?: number;
    completedAt?: string;
}
