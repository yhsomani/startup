/**
 * TalentSphere API Type Definitions
 * 
 * Type-safe contracts aligned with backend API responses.
 * Rule: No `any`, no inline parsing, no ad-hoc types.
 */

// ============================================
// Common Types
// ============================================

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}

// ============================================
// Auth Types
// ============================================

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    createdAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    userId: string;
    email: string;
    role: UserRole;
    accessToken: string;
    expiresIn: number;
}

// ============================================
// Course Types
// ============================================

export interface Course {
    id: string;
    instructorId: string;
    instructorName?: string;
    title: string;
    subtitle?: string;
    description: string;
    price: number;
    currency: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    isPublished: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    enrollmentCount?: number;
    sections?: Section[];
}

export interface Section {
    id: string;
    courseId: string;
    title: string;
    orderIndex: number;
    isActive: boolean;
    lessons: Lesson[];
}

export type LessonType = 'video' | 'quiz' | 'challenge' | 'text';

export interface Lesson {
    id: string;
    sectionId: string;
    title: string;
    description?: string;
    type: LessonType;
    orderIndex: number;
    videoUrl?: string;
    duration?: number;
    contentMarkdown?: string;
    challengeId?: string;
    isActive: boolean;
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    progressPercentage: number;
    isActive: boolean;
    enrolledAt: string;
    completedAt?: string;
    lastAccessedAt?: string;
}

export interface LessonProgress {
    id: string;
    enrollmentId: string;
    lessonId: string;
    isCompleted: boolean;
    completedAt?: string;
    videoPositionSeconds?: number;
}

export interface Certificate {
    id: string;
    enrollmentId: string;
    userId: string;
    courseId: string;
    courseTitle: string;
    userName: string;
    certificateUrl: string;
    verificationCode: string;
    issuedAt: string;
}

// ============================================
// Challenge Types
// ============================================

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SubmissionStatus = 'pending' | 'grading' | 'passed' | 'failed';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    datasetUrl?: string;
    evaluationMetric?: string;
    passingScore?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface Submission {
    id: string;
    challengeId: string;
    userId: string;
    filePath: string;
    status: SubmissionStatus;
    score?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
}

// ============================================
// Gamification Types
// ============================================

export interface UserStreak {
    id: number;
    userId: number;
    currentStreak: number;
    longestStreak: number;
    lastActivity?: string;
    streakStartDate?: string;
}

export interface UserPoints {
    id: number;
    userId: number;
    totalPoints: number;
    level: number;
    pointsToNextLevel: number;
}

export interface UserBadge {
    id: number;
    userId: number;
    badgeId: string;
    badgeName: string;
    badgeIcon: string;
    earnedAt: string;
}

export interface GamificationSummary {
    streak: UserStreak | null;
    points: UserPoints | null;
    badges: UserBadge[];
}

// ============================================
// AI Assistant Types
// ============================================

export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AssistantChatRequest {
    message: string;
    context?: string;
    courseId?: string;
}
