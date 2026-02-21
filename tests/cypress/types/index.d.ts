// Custom commands for TalentSphere E2E testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Register a new user
       * @param userData - User registration data
       */
      registerUser(userData: Partial<UserData>): Chainable<AuthResponse>;
      
      /**
       * Login as existing user
       * @param email - User email
       * @param password - User password
       */
      loginUser(email: string, password: string): Chainable<AuthResponse>;
      
      /**
       * Login as instructor
       * @param email - Instructor email
       * @param password - Instructor password
       */
      loginAsInstructor(email?: string, password?: string): Chainable<AuthResponse>;
      
      /**
       * Login as admin
       * @param email - Admin email
       * @param password - Admin password
       */
      loginAsAdmin(email?: string, password?: string): Chainable<AuthResponse>;
      
      /**
       * Create a test course
       * @param courseData - Course creation data
       */
      createCourse(courseData: Partial<CourseData>): Chainable<Course>;
      
      /**
       * Create a test challenge
       * @param challengeData - Challenge creation data
       */
      createChallenge(challengeData: Partial<ChallengeData>): Chainable<Challenge>;
      
      /**
       * Submit a challenge solution
       * @param challengeId - Challenge ID
       * @param code - Solution code
       */
      submitChallengeSolution(challengeId: string, code: string): Chainable<Submission>;
      
      /**
       * Get user gamification data
       * @param userId - User ID
       */
      getUserGamification(userId: string): Chainable<GamificationData>;
      
      /**
       * Search for candidates
       * @param criteria - Search criteria
       */
      searchCandidates(criteria: CandidateSearchCriteria): Chainable<Candidate[]>;
      
      /**
       * Create collaboration session
       * @param sessionData - Session data
       */
      createCollaborationSession(sessionData: Partial<CollaborationSessionData>): Chainable<CollaborationSession>;
      
      /**
       * Connect to WebSocket
       * @param url - WebSocket URL
       */
      connectWebSocket(url: string): Chainable<WebSocket>;
      
      /**
       * Wait for WebSocket message
       * @param eventType - Expected event type
       */
      waitForWebSocketMessage(eventType: string): Chainable<any>;
      
      /**
       * Check service health
       * @param serviceName - Service name
       */
      checkServiceHealth(serviceName: string): Chainable<boolean>;
      
      /**
       * Mock AI assistant response
       * @param message - Mock response message
       */
      mockAIAssistantResponse(message: string): Chainable<void>;
    }
  }
}

// Type definitions
interface UserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface CourseData {
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
}

interface ChallengeData {
  title: string;
  description?: string;
  evaluationMetric?: string;
  passingScore?: number;
  testCases?: any[];
  language?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  createdAt: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  evaluationMetric: string;
  passingScore: number;
  testCases: any[];
  language: string;
}

interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  status: 'pending' | 'passed' | 'failed';
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

interface GamificationData {
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastActivity: string;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  points: {
    totalPoints: number;
    level: number;
    pointsToNextLevel: number;
  };
}

interface CandidateSearchCriteria {
  skill?: string;
  minPercentile?: number;
  location?: string;
  experience?: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  skills: string[];
  verifiedResume: string;
  skillScores: Record<string, number>;
  percentile: number;
}

interface CollaborationSessionData {
  name: string;
  type?: 'general' | 'coding_study' | 'interview_practice' | 'code_review';
  maxParticipants?: number;
  settings?: Record<string, any>;
}

interface CollaborationSession {
  id: string;
  creatorId: string;
  name: string;
  type: string;
  maxParticipants: number;
  participants: string[];
  createdAt: string;
  settings: Record<string, any>;
}