/**
 * Challenge-related TypeScript types
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'go';
export type SubmissionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';

export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    points: number;
    language: Language;
    starterCode?: string;
    testCases?: TestCase[];
    isActive: boolean;
    createdAt: string;
}

export interface ChallengePreview {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    points: number;
    language: Language;
    isActive: boolean;
}

export interface Submission {
    id: string;
    challengeId: string;
    userId: string;
    code: string;
    language: Language;
    status: SubmissionStatus;
    score?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
}

export interface SubmissionResult {
    id: string;
    status: SubmissionStatus;
    score: number;
    testsPassed: number;
    testsTotal: number;
    feedback?: string;
    executionTime?: number;
}
