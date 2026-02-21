/**
 * Type exports - barrel file for all types
 */

// Course types
export type {
    Course,
    CoursePreview,
    CourseListResponse,
    Section,
    Lesson,
    CourseSkill,
    Instructor,
    Enrollment,
    LessonProgress,
    Pagination
} from './course';

// Challenge types
export type {
    Challenge,
    ChallengePreview,
    Submission,
    SubmissionResult,
    TestCase,
    Difficulty,
    Language,
    SubmissionStatus
} from './challenge';

// Gamification types
export type {
    GamificationProfile,
    Points,
    Streak,
    Badge,
    Achievement,
    LeaderboardEntry
} from './gamification';

// Notification types
export type {
    Notification,
    NotificationData,
    NotificationType,
    LeaderboardUpdate
} from './notification';

// Common types
export type {
    User,
    UserRole,
    ApiError,
    ApiResponse,
    PaginatedResponse
} from './common';

// Utility exports
export { isApiError, hasErrorMessage, getErrorMessage } from './common';
