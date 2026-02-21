/**
 * Courses API Service
 * 
 * Handles course, section, lesson, and enrollment endpoints.
 */
import api from './http';
import type {
    Course,
    Enrollment,
    LessonProgress,
    Certificate,
    PaginatedResponse,
} from './types';

interface CoursesListParams {
    page?: number;
    limit?: number;
    search?: string;
    instructorId?: string;
    isPublished?: boolean;
}

export const coursesApi = {
    // ============================================
    // Courses
    // ============================================

    /**
     * Get paginated list of courses
     */
    async getCourses(params: CoursesListParams = {}): Promise<PaginatedResponse<Course>> {
        const response = await api.get<PaginatedResponse<Course>>('/courses', { params });
        return response.data;
    },

    /**
     * Get a single course by ID with sections and lessons
     */
    async getCourseById(courseId: string): Promise<Course> {
        const response = await api.get<Course>(`/courses/${courseId}`);
        return response.data;
    },

    /**
     * Create a new course (instructor only)
     */
    async createCourse(data: Partial<Course>): Promise<Course> {
        const response = await api.post<Course>('/courses', data);
        return response.data;
    },

    /**
     * Update a course (instructor only)
     */
    async updateCourse(courseId: string, data: Partial<Course>): Promise<Course> {
        const response = await api.put<Course>(`/courses/${courseId}`, data);
        return response.data;
    },

    // ============================================
    // Enrollments
    // ============================================

    /**
     * Enroll in a course
     */
    async enroll(courseId: string): Promise<Enrollment> {
        const response = await api.post<Enrollment>('/enrollments', { courseId });
        return response.data;
    },

    /**
     * Get enrollment for a specific course
     */
    async getEnrollment(courseId: string): Promise<Enrollment | null> {
        try {
            const response = await api.get<Enrollment>('/enrollments/lookup', {
                params: { courseId },
            });
            return response.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Get all enrollments for current user
     */
    async getMyEnrollments(): Promise<Enrollment[]> {
        const response = await api.get<Enrollment[]>('/enrollments/my');
        return response.data;
    },

    // ============================================
    // Lesson Progress
    // ============================================

    /**
     * Mark a lesson as complete
     */
    async completeLesson(enrollmentId: string, lessonId: string): Promise<LessonProgress> {
        const response = await api.put<LessonProgress>(
            `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`
        );
        return response.data;
    },

    /**
     * Update video position for a lesson
     */
    async updateVideoPosition(
        enrollmentId: string,
        lessonId: string,
        positionSeconds: number
    ): Promise<void> {
        await api.put(`/enrollments/${enrollmentId}/lessons/${lessonId}/position`, {
            videoPositionSeconds: positionSeconds,
        });
    },

    // ============================================
    // Certificates
    // ============================================

    /**
     * Get certificate for completed course
     */
    async getCertificate(courseId: string): Promise<Certificate | null> {
        try {
            const response = await api.get<Certificate>(`/certificates/course/${courseId}`);
            return response.data;
        } catch {
            return null;
        }
    },

    /**
     * Request certificate generation
     */
    async requestCertificate(enrollmentId: string): Promise<Certificate> {
        const response = await api.post<Certificate>('/certificates', { enrollmentId });
        return response.data;
    },
};

export default coursesApi;
