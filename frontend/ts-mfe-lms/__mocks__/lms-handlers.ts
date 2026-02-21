import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const handlers = [
    // Course Details
    http.get(`${API_BASE_URL}/courses/:courseId`, async ({ params }: { params: any }) => {
        const { courseId } = params;
        return HttpResponse.json({
            id: courseId,
            title: 'Mastering Vitest',
            subtitle: 'Testing for Experts',
            description: 'Deep dive into Vitest',
            instructorName: 'Test Instructor',
            sections: [
                {
                    id: 's1',
                    title: 'Introduction',
                    lessons: [
                        { id: 'l1', title: 'Vitest Intro', type: 'video', videoUrl: 'https://example.com/video.mp4' },
                        { id: 'l2', title: 'Setup Guide', type: 'text', content: 'Configure your environment' }
                    ]
                }
            ]
        });
    }),

    // Progress / Enrollments
    http.get(`${API_BASE_URL}/enrollments/lookup`, async ({ request }) => {
        const url = new URL(request.url);
        const courseId = url.searchParams.get('courseId');

        return HttpResponse.json({
            id: 'e1',
            userId: 'user-123',
            courseId: courseId || 'course-123',
            completedLessons: [],
            progressPercentage: 0,
            status: 'enrolled'
        });
    }),

    http.put(`${API_BASE_URL}/enrollments/:enrollmentId/lessons/:lessonId/complete`, async () => {
        return HttpResponse.json({ success: true });
    }),

    // Certificates
    http.get(`${API_BASE_URL}/certificates/:enrollmentId`, async () => {
        return HttpResponse.json({
            id: 'cert1',
            certificateUrl: 'https://example.com/cert.pdf',
            issuedAt: new Date().toISOString()
        });
    })
];
