/**
 * Gamification API Service
 * 
 * Handles streaks, points, badges, and leaderboard endpoints.
 */
import api from './http';
import type { UserStreak, UserPoints, UserBadge, GamificationSummary } from './types';

export const gamificationApi = {
    // ============================================
    // Streaks
    // ============================================

    /**
     * Get current user's streak
     */
    async getStreak(): Promise<UserStreak | null> {
        try {
            const response = await api.get<UserStreak>('/gamification/streak');
            return response.data;
        } catch {
            return null;
        }
    },

    /**
     * Record activity to update streak
     */
    async recordActivity(): Promise<UserStreak> {
        const response = await api.post<UserStreak>('/gamification/streak/activity');
        return response.data;
    },

    // ============================================
    // Points
    // ============================================

    /**
     * Get current user's points
     */
    async getPoints(): Promise<UserPoints | null> {
        try {
            const response = await api.get<UserPoints>('/gamification/points');
            return response.data;
        } catch {
            return null;
        }
    },

    /**
     * Add points for an action
     */
    async addPoints(action: string, amount: number): Promise<UserPoints> {
        const response = await api.post<UserPoints>('/gamification/points', { action, amount });
        return response.data;
    },

    // ============================================
    // Badges
    // ============================================

    /**
     * Get current user's badges
     */
    async getBadges(): Promise<UserBadge[]> {
        const response = await api.get<UserBadge[]>('/gamification/badges');
        return response.data;
    },

    /**
     * Check and award eligible badges
     */
    async checkBadges(): Promise<UserBadge[]> {
        const response = await api.post<UserBadge[]>('/gamification/badges/check');
        return response.data;
    },

    // ============================================
    // Summary
    // ============================================

    /**
     * Get full gamification summary for current user
     */
    async getSummary(): Promise<GamificationSummary> {
        const response = await api.get<GamificationSummary>('/gamification/summary');
        return response.data;
    },

    // ============================================
    // Leaderboard
    // ============================================

    /**
     * Get points leaderboard
     */
    async getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
        const response = await api.get<UserPoints[]>('/gamification/leaderboard', {
            params: { limit },
        });
        return response.data;
    },
};

export default gamificationApi;
