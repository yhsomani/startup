/**
 * TalentSphere Feature Flags
 * 
 * Centralized configuration with full lifecycle management.
 * 
 * Lifecycle: CREATED → DEVELOPMENT → TESTING → ACTIVATION → STABILIZATION → REMOVAL
 * 
 * Usage:
 *   import { featureFlags } from '@/config/featureFlags';
 *   if (featureFlags.isEnabled('NEW_FEATURE')) { ... }
 */
import api from '../services/api';

// Lifecycle stages
export type FlagLifecycle =
    | 'CREATED'      // Just introduced, default OFF
    | 'DEVELOPMENT'  // Active development, enabled in dev
    | 'TESTING'      // CI testing both ON/OFF
    | 'ACTIVATION'   // Enabled in staging/prod
    | 'STABILIZATION'// Running without issues
    | 'REMOVAL';     // Ready to remove, feature is permanent

export interface FeatureFlag {
    name: string;
    description: string;
    defaultEnabled: boolean;
    lifecycle: FlagLifecycle;
    createdDate: string;
    maxLifespanDays: number; // Flag must be removed within this period
    owner: string;
}

// Maximum allowed lifespan for any feature flag (90 days)
const MAX_FLAG_LIFESPAN_DAYS = 90;

// All feature flags - default OFF unless stable
const FLAGS: Record<string, FeatureFlag> = {
    // Certificate Generation - STABILIZATION (ready for removal)
    CERTIFICATE_GENERATION: {
        name: 'CERTIFICATE_GENERATION',
        description: 'PDF certificate generation for course completion',
        defaultEnabled: true,
        lifecycle: 'STABILIZATION',
        createdDate: '2025-12-20',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-springboot',
    },

    // Event Publishers - STABILIZATION
    EVENT_PUBLISHERS: {
        name: 'EVENT_PUBLISHERS',
        description: 'RabbitMQ event publishing for enrollment/progress',
        defaultEnabled: true,
        lifecycle: 'STABILIZATION',
        createdDate: '2025-12-20',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-all',
    },

    // Real-time Notifications - DEVELOPMENT
    REALTIME_NOTIFICATIONS: {
        name: 'REALTIME_NOTIFICATIONS',
        description: 'WebSocket notifications for real-time updates',
        defaultEnabled: false,
        lifecycle: 'DEVELOPMENT',
        createdDate: '2025-12-27',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'ts-notification-service',
    },

    // Challenge Leaderboard - ACTIVATION
    CHALLENGE_LEADERBOARD: {
        name: 'CHALLENGE_LEADERBOARD',
        description: 'Challenge leaderboard display',
        defaultEnabled: true,
        lifecycle: 'ACTIVATION',
        createdDate: '2025-12-15',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'ts-mfe-challenge',
    },

    // Course Progress - ACTIVATION
    COURSE_PROGRESS: {
        name: 'COURSE_PROGRESS',
        description: 'Course progress tracking and display',
        defaultEnabled: true,
        lifecycle: 'ACTIVATION',
        createdDate: '2025-12-15',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'ts-mfe-lms',
    },

    // Phase 10 Features - CREATED (default OFF)
    AI_ASSISTANT: {
        name: 'AI_ASSISTANT',
        description: 'AI-powered personal tutor chat widget',
        defaultEnabled: false,
        lifecycle: 'CREATED',
        createdDate: '2025-12-27',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-assistant',
    },

    CODE_EXECUTION: {
        name: 'CODE_EXECUTION',
        description: 'Real-time code execution sandboxing',
        defaultEnabled: false,
        lifecycle: 'CREATED',
        createdDate: '2025-12-27',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-flask',
    },

    RECRUITMENT_DASHBOARD: {
        name: 'RECRUITMENT_DASHBOARD',
        description: 'B2B recruiter candidate search dashboard',
        defaultEnabled: false,
        lifecycle: 'CREATED',
        createdDate: '2025-12-27',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-recruitment',
    },

    GAMIFICATION: {
        name: 'GAMIFICATION',
        description: 'Gamification features (streaks, badges, points)',
        defaultEnabled: false,
        lifecycle: 'CREATED',
        createdDate: '2025-12-27',
        maxLifespanDays: MAX_FLAG_LIFESPAN_DAYS,
        owner: 'backend-gamification',
    },
};

class FeatureFlagService {
    private overrides: Map<string, boolean> = new Map();

    /**
     * Check if a feature is enabled
     */
    isEnabled(flagName: string): boolean {
        if (this.overrides.has(flagName)) {
            return this.overrides.get(flagName)!;
        }

        if (typeof window !== 'undefined') {
            const localOverride = localStorage.getItem(`ff_${flagName}`);
            if (localOverride !== null) {
                return localOverride === 'true';
            }
        }

        const flag = FLAGS[flagName];
        return flag ? flag.defaultEnabled : false;
    }

    /**
     * Set override for testing
     */
    setOverride(flagName: string, enabled: boolean): void {
        this.overrides.set(flagName, enabled);
    }

    /**
     * Clear all overrides
     */
    clearOverrides(): void {
        this.overrides.clear();
    }

    /**
     * Get all flags
     */
    getAllFlags(): Record<string, FeatureFlag> {
        return FLAGS;
    }

    /**
     * Get flag status summary
     */
    getStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        for (const flagName of Object.keys(FLAGS)) {
            status[flagName] = this.isEnabled(flagName);
        }
        return status;
    }

    /**
     * Get flags by lifecycle stage
     */
    getFlagsByLifecycle(lifecycle: FlagLifecycle): FeatureFlag[] {
        return Object.values(FLAGS).filter(f => f.lifecycle === lifecycle);
    }

    /**
     * Check for stale flags (exceeded max lifespan)
     */
    getStaleFlags(): FeatureFlag[] {
        const now = new Date();
        return Object.values(FLAGS).filter(flag => {
            const created = new Date(flag.createdDate);
            const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return ageInDays > flag.maxLifespanDays && flag.lifecycle !== 'REMOVAL';
        });
    }

    /**
     * Get flags ready for removal (in STABILIZATION)
     */
    getFlagsReadyForRemoval(): FeatureFlag[] {
        return Object.values(FLAGS).filter(f => f.lifecycle === 'STABILIZATION');
    }

    /**
     * Validate all flags (for CI)
     */
    validateFlags(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const staleFlags = this.getStaleFlags();

        if (staleFlags.length > 0) {
            errors.push(`Stale flags detected: ${staleFlags.map(f => f.name).join(', ')}`);
        }

        // Check for flags in REMOVAL stage (should be cleaned up)
        const removalFlags = Object.values(FLAGS).filter(f => f.lifecycle === 'REMOVAL');
        if (removalFlags.length > 0) {
            errors.push(`Flags pending removal: ${removalFlags.map(f => f.name).join(', ')}`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Sync flags with backend
     */
    async syncWithBackend(): Promise<void> {
        try {
            const response = await api.get('/flags');
            const backendFlags = response.data;

            // Backend returns object { FLAG_NAME: boolean }
            Object.keys(backendFlags).forEach(key => {
                this.setOverride(key, backendFlags[key]);
            });
            console.log('Feature flags synced with backend', backendFlags);
        } catch (error) {
            console.warn('Failed to sync feature flags with backend:', error);
        }
    }
}

export const featureFlags = new FeatureFlagService();
export const FLAGS_LIST = FLAGS;
export type FlagName = keyof typeof FLAGS;
