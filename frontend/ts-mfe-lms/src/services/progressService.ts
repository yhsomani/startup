import springApi from './springApi';

// Toggle this or use Env Var VITE_USE_MOCK=true to enable mocking
// Default: use real backend unless mock is explicitly enabled
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Mock Data Interfaces
interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    progressPercentage: number;
    status: 'enrolled' | 'in_progress' | 'completed';
    completedLessons: string[]; // IDs of completed lessons
}

// Service Definition
export const progressService = {

    async enroll(courseId: string, userId: string): Promise<any> {
        if (!USE_MOCK) {
            // Real Backend: POST /enrollments
            // Body: { courseId, userId } (userId in token, but DTO might ask for it)
            const response = await springApi.post('/enrollments', { courseId, userId });
            return response.data;
        }

        // Mock Logic
        console.log(`[Mock] Enrolling user ${userId} in course ${courseId} `);
        const enrollments = this.getStoredEnrollments();

        if (enrollments.some(e => e.userId === userId && e.courseId === courseId)) {
            console.warn("Already enrolled");
            return;
        }

        const newEnrollment: Enrollment = {
            id: crypto.randomUUID(),
            userId,
            courseId,
            progressPercentage: 0,
            status: 'enrolled',
            completedLessons: []
        };

        enrollments.push(newEnrollment);
        localStorage.setItem('mock_enrollments', JSON.stringify(enrollments));
        return newEnrollment;
    },

    async getEnrollment(courseId: string, userId: string): Promise<Enrollment | null> {
        if (!USE_MOCK) {
            try {
                // Now using the lookup endpoint implemented in Flask
                const response = await springApi.get('/enrollments/lookup', {
                    params: { courseId }
                });
                return response.data;
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    return null;
                }
                console.error("Failed to fetch enrollment", error);
                return null;
            }
        }

        const enrollments = this.getStoredEnrollments();
        return enrollments.find(e => e.userId === userId && e.courseId === courseId) || null;
    },

    async completeLesson(enrollmentId: string, lessonId: string): Promise<void> {
        if (!USE_MOCK) {
            await springApi.put(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`);
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const enrollments = this.getStoredEnrollments();
        const enrollment = enrollments.find(e => e.id === enrollmentId || (e.userId === userId && e.courseId === enrollmentId)); // Fallback

        if (enrollment) {
            if (!enrollment.completedLessons.includes(lessonId)) {
                enrollment.completedLessons.push(lessonId);
                enrollment.progressPercentage = Math.min(100, enrollment.progressPercentage + 10);
                localStorage.setItem('mock_enrollments', JSON.stringify(enrollments));
            }
        }
    },

    // Helper
    getStoredEnrollments(): Enrollment[] {
        const stored = localStorage.getItem('mock_enrollments');
        return stored ? JSON.parse(stored) : [];
    }
};
