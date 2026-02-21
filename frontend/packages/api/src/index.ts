/**
 * @talentsphere/api
 * 
 * Centralized API client package for TalentSphere frontend.
 * 
 * Usage:
 *   import { authApi, coursesApi, challengesApi } from '@talentsphere/api';
 *   import type { Course, Challenge, User } from '@talentsphere/api';
 */

// Core HTTP client and configuration
export { api, configureAuth } from './http';
export type { ApiError } from './http';

// API Services
export { authApi } from './auth';
export { coursesApi } from './courses';
export { challengesApi } from './challenges';
export { gamificationApi } from './gamification';

// Type exports
export type {
    // Common
    Pagination,
    PaginatedResponse,
    // Auth
    User,
    UserRole,
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    // Courses
    Course,
    Section,
    Lesson,
    LessonType,
    Enrollment,
    LessonProgress,
    Certificate,
    // Challenges
    Challenge,
    ChallengeDifficulty,
    Submission,
    SubmissionStatus,
    // Gamification
    UserStreak,
    UserPoints,
    UserBadge,
    GamificationSummary,
    // AI
    AssistantMessage,
    AssistantChatRequest,
} from './types';
