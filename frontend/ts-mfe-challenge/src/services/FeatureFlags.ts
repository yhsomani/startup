export const FeatureFlags = {
    ENABLE_MANUAL_GRADING: false,
    ENABLE_CHALLENGE_MANAGEMENT: false,
    ENABLE_USER_HISTORY: false,
};

export const isFeatureEnabled = (flag: keyof typeof FeatureFlags): boolean => {
    const override = localStorage.getItem(`FF_${flag}`);
    if (override === 'true') return true;
    if (override === 'false') return false;
    return FeatureFlags[flag];
};
