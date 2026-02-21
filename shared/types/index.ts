/**
 * TalentSphere Shared Type Definitions and Contracts
 * Centralized type definitions for frontend-backend consistency
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
  pagination?: PaginationInfo;
}

/**
 * Standard error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  timestamp: string;
  requestId: string;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  userId?: string;
  service?: string;
  version: string;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/**
 * User roles
 */
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * User registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  agreeToTerms: boolean;
  newsletterOptIn?: boolean;
}

/**
 * User login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Auth response
 */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * User profile
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  marketing: boolean;
  courseUpdates: boolean;
  challengeUpdates: boolean;
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'connections';
  showProgress: boolean;
  showAchievements: boolean;
  allowRecommendations: boolean;
}

// =============================================================================
// COURSE TYPES
// =============================================================================

/**
 * Course difficulty levels
 */
export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Course status
 */
export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  UNDER_REVIEW = 'under_review'
}

/**
 * Course request/response
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructorId: string;
  instructor?: User;
  categoryId: string;
  category?: Category;
  difficulty: CourseDifficulty;
  duration: number; // in minutes
  price: number;
  currency: string;
  status: CourseStatus;
  thumbnail?: string;
  previewVideo?: string;
  tags: string[];
  learningObjectives: string[];
  prerequisites: string[];
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  modules: CourseModule[];
  isEnrolled?: boolean;
  progress?: CourseProgress;
}

/**
 * Course module
 */
export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  duration: number;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'discussion';
  contentUrl?: string;
  content?: any;
  isPublished: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  lessons: Lesson[];
  quiz?: Quiz;
}

/**
 * Lesson
 */
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  orderIndex: number;
  duration: number;
  type: 'video' | 'reading' | 'quiz' | 'assignment';
  contentUrl?: string;
  content?: any;
  isPublished: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Course category
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Course enrollment
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  lastAccessAt?: string;
  progress: CourseProgress;
  certificate?: Certificate;
  isActive: boolean;
}

/**
 * Course progress
 */
export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  totalTimeSpent: number;
  lastAccessAt: string;
  currentModuleId?: string;
  currentLessonId?: string;
  quizScores: QuizScore[];
}

// =============================================================================
// CHALLENGE TYPES
// =============================================================================

/**
 * Challenge difficulty
 */
export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Challenge type
 */
export enum ChallengeType {
  ALGORITHM = 'algorithm',
  DATA_STRUCTURE = 'data_structure',
  SYSTEM_DESIGN = 'system_design',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULL_STACK = 'full_stack'
}

/**
 * Challenge
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  type: ChallengeType;
  categoryId: string;
  category?: Category;
  creatorId: string;
  creator?: User;
  tags: string[];
  timeLimit: number; // in minutes
  memoryLimit: number; // in MB
  points: number;
  starterCode: Record<string, string>;
  testCases: TestCase[];
  explanation?: string;
  solution?: string;
  submissionCount: number;
  successRate: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  userSubmission?: Submission;
}

/**
 * Test case
 */
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

/**
 * Submission
 */
export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  testResults: TestResult[];
  score: number;
  executionTime: number;
  memoryUsed: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  feedback?: string;
}

/**
 * Submission status
 */
export enum SubmissionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded'
}

/**
 * Test result
 */
export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  challengesSolved: number;
  submissions: number;
  successRate: number;
}

// =============================================================================
// QUIZ TYPES
// =============================================================================

/**
 * Quiz
 */
export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Question
 */
export interface Question {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  orderIndex: number;
}

/**
 * Quiz score
 */
export interface QuizScore {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  attempt: number;
  answers: QuizAnswer[];
  completedAt: string;
  timeSpent: number;
}

/**
 * Quiz answer
 */
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

// =============================================================================
// GAMIFICATION TYPES
// =============================================================================

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeUrl: string;
  points: number;
  category: string;
  isHidden: boolean;
  criteria: AchievementCriteria;
  createdAt: string;
  isUnlocked?: boolean;
  unlockedAt?: string;
}

/**
 * Achievement criteria
 */
export interface AchievementCriteria {
  type: string;
  value: number;
  description: string;
}

/**
 * User achievement
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  isDisplayed: boolean;
}

/**
 * User streak
 */
export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: StreakDay[];
}

/**
 * Streak day
 */
export interface StreakDay {
  date: string;
  activities: number;
}

/**
 * User points
 */
export interface UserPoints {
  id: string;
  userId: string;
  totalPoints: number;
  pointsByCategory: Record<string, number>;
  lastUpdated: string;
  pointHistory: PointTransaction[];
}

/**
 * Point transaction
 */
export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  category: string;
  source: string;
  description: string;
  createdAt: string;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification type
 */
export enum NotificationType {
  COURSE_ENROLLMENT = 'course_enrollment',
  COURSE_COMPLETION = 'course_completion',
  CHALLENGE_SOLVED = 'challenge_solved',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  FRIEND_REQUEST = 'friend_request',
  MESSAGE_RECEIVED = 'message_received',
  ASSIGNMENT_DUE = 'assignment_due'
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

// =============================================================================
// AI ASSISTANT TYPES
// =============================================================================

/**
 * AI chat request
 */
export interface AIChatRequest {
  message: string;
  context?: AIContext;
  userId?: string;
  sessionId?: string;
  language?: string;
}

/**
 * AI context
 */
export interface AIContext {
  courseId?: string;
  challengeId?: string;
  code?: string;
  error?: string;
  learningPath?: string;
}

/**
 * AI response
 */
export interface AIResponse {
  id: string;
  message: string;
  type: 'text' | 'code' | 'explanation' | 'suggestion';
  code?: string;
  language?: string;
  explanation?: string;
  suggestions?: AISuggestion[];
  confidence: number;
  timestamp: string;
  sessionId: string;
}

/**
 * AI suggestion
 */
export interface AISuggestion {
  type: string;
  description: string;
  code?: string;
  priority: number;
}

/**
 * AI recommendations
 */
export interface AIRecommendations {
  courses: Course[];
  challenges: Challenge[];
  learningPaths: LearningPath[];
  skills: SkillGap[];
}

/**
 * Learning path
 */
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  estimatedDuration: number;
  difficulty: CourseDifficulty;
  tags: string[];
}

/**
 * Skill gap
 */
export interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  recommendedResources: (Course | Challenge)[];
}

// =============================================================================
// COLLABORATION TYPES
// =============================================================================

/**
 * Collaboration session
 */
export interface CollaborationSession {
  id: string;
  type: 'code_editor' | 'whiteboard' | 'video_chat';
  title: string;
  description?: string;
  createdBy: string;
  participants: CollaborationParticipant[];
  isActive: boolean;
  createdAt: string;
  endsAt?: string;
  settings: CollaborationSettings;
}

/**
 * Collaboration participant
 */
export interface CollaborationParticipant {
  userId: string;
  user?: User;
  joinedAt: string;
  role: 'owner' | 'editor' | 'viewer';
  isActive: boolean;
  permissions: string[];
}

/**
 * Collaboration settings
 */
export interface CollaborationSettings {
  isPublic: boolean;
  allowAnonymous: boolean;
  maxParticipants: number;
  requireApproval: boolean;
  recordSession: boolean;
}

// =============================================================================
// VIDEO TYPES
// =============================================================================

/**
 * Video
 */
export interface Video {
  id: string;
  title: string;
  description?: string;
  duration: number;
  size: number;
  format: string;
  resolution: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  downloadUrl?: string;
  isPublic: boolean;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
  transcriptions?: VideoTranscription[];
}

/**
 * Video transcription
 */
export interface VideoTranscription {
  id: string;
  videoId: string;
  language: string;
  text: string;
  confidence: number;
  timestamp: number;
  duration: number;
}

// =============================================================================
// SEARCH AND FILTERING TYPES
// =============================================================================

/**
 * Search query
 */
export interface SearchQuery {
  q?: string;
  categories?: string[];
  tags?: string[];
  difficulty?: ChallengeDifficulty | CourseDifficulty;
  type?: string;
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'popular' | 'rating' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Search response
 */
export interface SearchResponse<T> {
  results: T[];
  totalCount: number;
  query: SearchQuery;
  facets: SearchFacets;
  suggestions?: string[];
}

/**
 * Search facets
 */
export interface SearchFacets {
  categories: Category[];
  tags: string[];
  difficulties: string[];
  types: string[];
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

// =============================================================================
// HEALTH AND MONITORING TYPES
// =============================================================================

/**
 * Health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  checks: HealthCheck[];
}

/**
 * Service health
 */
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  details?: Record<string, unknown>;
}

/**
 * Health check
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  // Core
  ApiResponse,
  ApiError,
  PaginationInfo,
  RequestMetadata,
  
  // Auth
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
  UserPreferences,
  NotificationPreferences,
  PrivacyPreferences,
  
  // Courses
  Course,
  CourseModule,
  Lesson,
  Category,
  Enrollment,
  CourseProgress,
  
  // Challenges
  Challenge,
  TestCase,
  Submission,
  TestResult,
  LeaderboardEntry,
  
  // Quiz
  Quiz,
  Question,
  QuizScore,
  QuizAnswer,
  
  // Gamification
  Achievement,
  AchievementCriteria,
  UserAchievement,
  UserStreak,
  UserPoints,
  PointTransaction,
  
  // Notifications
  Notification,
  
  // AI Assistant
  AIChatRequest,
  AIContext,
  AIResponse,
  AISuggestion,
  AIRecommendations,
  LearningPath,
  SkillGap,
  
  // Collaboration
  CollaborationSession,
  CollaborationParticipant,
  CollaborationSettings,
  
  // Video
  Video,
  VideoTranscription,
  
  // Search
  SearchQuery,
  SearchResponse,
  SearchFacets,
  
  // Validation
  ValidationError,
  ValidationResult,
  ValidationWarning,
  
  // Health
  HealthStatus,
  ServiceHealth,
  HealthCheck
};

export { UserRole, CourseStatus, CourseDifficulty, ChallengeDifficulty, ChallengeType, SubmissionStatus, NotificationType };