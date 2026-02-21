/**
 * Feature Flags Store
 * 
 * Global feature flag state.
 */
import { create } from 'zustand';

interface FeatureFlags {
    aiAssistant: boolean;
    codeExecution: boolean;
    recruitment: boolean;
    gamification: boolean;
}

interface FeatureFlagsState {
    flags: FeatureFlags;
    setFlags: (flags: Partial<FeatureFlags>) => void;
    isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
    aiAssistant: true,
    codeExecution: true,
    recruitment: true,
    gamification: true,
};

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
    flags: DEFAULT_FLAGS,

    setFlags: (newFlags) =>
        set((state) => ({
            flags: { ...state.flags, ...newFlags },
        })),

    isEnabled: (flag) => get().flags[flag],
}));

/**
 * Hook to check if a feature is enabled
 */
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
    return useFeatureFlagsStore((state) => state.flags[flag]);
};

export default useFeatureFlagsStore;
