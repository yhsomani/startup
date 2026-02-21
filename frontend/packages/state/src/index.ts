/**
 * @talentsphere/state
 * 
 * Centralized state management package for TalentSphere frontend.
 * 
 * Usage:
 *   import { useAuthStore, useFeatureFlag } from '@talentsphere/state';
 */

// Auth store
export {
    useAuthStore,
    useHasRole,
    useIsInstructor,
    useIsAdmin,
} from './authStore';
export type { AuthUser } from './authStore';

// Feature flags
export {
    useFeatureFlagsStore,
    useFeatureFlag,
} from './featureFlags';

// Courses store
export { useCourses } from './coursesStore';
export type { Course } from './coursesStore';
