/**
 * Gamification-related TypeScript types
 */

export interface Badge {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earnedAt?: string;
}

export interface Streak {
    current: number;
    longest: number;
    lastActivityDate: string;
    isActiveToday: boolean;
}

export interface Points {
    total: number;
    thisWeek: number;
    thisMonth: number;
    rank?: number;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    avatarUrl?: string;
    points: number;
    rank: number;
    badges: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    isComplete: boolean;
    completedAt?: string;
}

export interface GamificationProfile {
    userId: string;
    points: Points;
    streak: Streak;
    badges: Badge[];
    achievements: Achievement[];
    level: number;
    xpToNextLevel: number;
}
