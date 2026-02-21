// MSW Request Handlers for API Mocking
import { http, HttpResponse, delay } from 'msw';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const handlers = [
  // ==================== AUTH ====================

  // Login - Success
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }: { request: any }) => {
    const body = await request.json() as any;

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'STUDENT',
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
      });
    }

    return HttpResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
      { status: 401 }
    );
  }),

  // Register - Success
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }: { request: any }) => {
    const body = await request.json() as any;

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: { code: 'USER_EXISTS', message: 'User already exists' } },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: body.email,
      role: body.role || 'STUDENT',
      accessToken: 'mock-jwt-token',
      tokenType: 'Bearer',
    }, { status: 201 });
  }),

  // Health Check
  http.get(`${API_BASE_URL}/auth/health`, () => {
    return HttpResponse.json({ status: 'healthy' });
  }),

  // Get Session
  http.get(`${API_BASE_URL}/auth/session`, () => {
    return HttpResponse.json({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'STUDENT'
    });
  }),

  // ==================== NOTIFICATIONS ====================
  http.get(`${API_BASE_URL}/notifications`, () => {
    return HttpResponse.json([]);
  }),

  // ==================== COURSES ====================

  // Get All Courses
  http.get(`${API_BASE_URL}/courses`, async () => {
    // const url = new URL(request.url);
    // Removed unused page/limit for linter

    await delay(100); // Simulate network delay

    const courses = Array.from({ length: 5 }, (_, i) => ({
      id: `course-${i + 1}`,
      title: i === 0 ? 'Test Course' : `Course ${i + 1}`,
      subtitle: `Subtitle ${i + 1}`,
      description: `Description ${i + 1}`,
      price: (i + 1) * 10,
      currency: 'USD',
      isPublished: true,
      instructorId: 'instructor-1',
      sections: [],
      skills: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return HttpResponse.json(courses);
  }),

  // Get Course by ID
  http.get(`${API_BASE_URL}/courses/:courseId`, async ({ params }: { params: any }) => {
    const { courseId } = params;

    if (courseId === 'not-found') {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id: courseId,
      title: 'Test Course',
      subtitle: 'Test Subtitle',
      description: 'Test Description',
      price: 49.99,
      currency: 'USD',
      isPublished: true,
      instructorId: 'instructor-1',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          orderIndex: 0,
          lessons: [
            {
              id: 'lesson-1',
              title: 'Lesson 1',
              type: 'video',
              orderIndex: 0,
              videoUrl: 'https://example.com/video.mp4',
              duration: 600,
            },
          ],
        },
      ],
      skills: [{ id: 'skill-1', skillName: 'JavaScript' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // Create Course
  http.post(`${API_BASE_URL}/courses`, async ({ request }: { request: any }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'new-course-id',
      ...body,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // ==================== ENROLLMENTS ====================

  // Get User Enrollments
  http.get(`${API_BASE_URL}/enrollments`, async () => {
    return HttpResponse.json([]);
  }),

  // Get User Enrollments by UserID
  http.get(`${API_BASE_URL}/enrollments/user/:userId`, async () => {
    return HttpResponse.json([]);
  }),

  // Create Enrollment
  http.post(`${API_BASE_URL}/enrollments`, async ({ request }: { request: any }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'new-enrollment-id',
      userId: body.userId,
      courseId: body.courseId,
      enrolledAt: new Date().toISOString(),
      progressPercentage: 0,
      completedAt: null,
    }, { status: 201 });
  }),

  // Mark Lesson Complete
  http.put(`${API_BASE_URL}/enrollments/:enrollmentId/lessons/:lessonId/complete`, async () => {
    return HttpResponse.json({
      lessonProgress: {
        lessonId: 'lesson-1',
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      enrollmentProgress: 50,
    });
  }),

  // ==================== CHALLENGES ====================

  // Get All Challenges
  http.get(`${API_BASE_URL}/challenges`, async () => {
    await delay(100);

    return HttpResponse.json([
      {
        id: 'challenge-1',
        title: 'Titanic Survival Prediction',
        description: 'Predict survival on the Titanic',
        difficulty: 'medium',
        evaluationMetric: 'accuracy',
        totalSubmissions: 1247,
        successRate: 0.68,
      },
      {
        id: 'challenge-2',
        title: 'House Price Prediction',
        description: 'Predict house prices',
        difficulty: 'easy',
        evaluationMetric: 'rmse',
        totalSubmissions: 892,
        successRate: 0.72,
      },
    ]);
  }),

  // Get Challenge by ID
  http.get(`${API_BASE_URL}/challenges/:challengeId`, async ({ params }: { params: any }) => {
    const { challengeId } = params;

    return HttpResponse.json({
      id: challengeId,
      lessonId: 'lesson-1',
      title: 'Test Challenge',
      description: 'Test challenge description',
      problemStatement: '# Problem\n\nSolve this...',
      datasetUrl: 'https://example.com/dataset.csv',
      evaluationMetric: 'accuracy',
      timeLimit: 3600,
      memoryLimit: 512,
      rules: 'Follow the rules...',
    });
  }),

  // Submit Challenge
  http.post(`${API_BASE_URL}/challenges/:challengeId/submit`, async () => {
    await delay(500);

    return HttpResponse.json({
      submissionId: 'submission-1',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      message: 'Submission queued for grading',
    }, { status: 202 });
  }),

  // Get Leaderboard
  http.get(`${API_BASE_URL}/challenges/:challengeId/leaderboard`, async () => {
    return HttpResponse.json({
      challengeId: 'challenge-1',
      entries: [
        {
          rank: 1,
          userId: 'user-1',
          username: 'champion',
          score: 95.5,
          submissionCount: 3,
          bestSubmissionAt: new Date().toISOString(),
        },
        {
          rank: 2,
          userId: 'user-2',
          username: 'runner-up',
          score: 92.3,
          submissionCount: 5,
          bestSubmissionAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // ==================== ERROR SCENARIOS ====================

  // Network timeout
  http.get(`${API_BASE_URL}/slow-endpoint`, async () => {
    await delay(10000);
    return HttpResponse.json({ data: 'slow' });
  }),

  // Server error
  http.get(`${API_BASE_URL}/error-endpoint`, () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }),

  // Unauthorized
  http.get(`${API_BASE_URL}/protected-endpoint`, ({ request }: { request: any }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return HttpResponse.json({ data: 'protected content' });
  }),
];
