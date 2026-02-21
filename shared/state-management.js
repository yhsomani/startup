/**
 * TalentSphere Frontend State Management System
 * Provides standardized state management across all micro-frontends using Zustand
 */

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";

// Base store configuration
const storeConfig = {
    name: "talentsphere-store",
    version: 1,
    storage: {
        getItem: name => {
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: name => {
            localStorage.removeItem(name);
        },
    },
};

// Authentication Store
export const useAuthStore = create(
    devtools(
        persist(
            subscribeWithSelector((set, get) => ({
                // State
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                permissions: [],
                roles: [],
                sessionTimeout: null,

                // Actions
                setLoading: loading => set({ isLoading: loading }),
                setError: error => set({ error }),

                login: async credentials => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await fetch("/api/auth/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(credentials),
                        });

                        if (!response.ok) {
                            throw new Error("Login failed");
                        }

                        const data = await response.json();
                        const sessionTimeout = Date.now() + data.expiresIn * 1000;

                        set({
                            user: data.user,
                            token: data.token,
                            refreshToken: data.refreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                            permissions: data.permissions || [],
                            roles: data.roles || [],
                            sessionTimeout,
                        });

                        return data;
                    } catch (error) {
                        set({ error: error.message, isLoading: false });
                        throw error;
                    }
                },

                logout: () => {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        error: null,
                        permissions: [],
                        roles: [],
                        sessionTimeout: null,
                    });
                },

                refreshAuth: async () => {
                    const { refreshToken } = get();
                    if (!refreshToken) {
                        get().logout();
                        return;
                    }

                    try {
                        const response = await fetch("/api/auth/refresh", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ refreshToken }),
                        });

                        if (!response.ok) {
                            throw new Error("Token refresh failed");
                        }

                        const data = await response.json();
                        const sessionTimeout = Date.now() + data.expiresIn * 1000;

                        set({
                            token: data.token,
                            refreshToken: data.refreshToken,
                            sessionTimeout,
                        });

                        return data;
                    } catch (error) {
                        get().logout();
                        throw error;
                    }
                },

                hasPermission: permission => {
                    const { permissions } = get();
                    return permissions.includes(permission);
                },

                hasRole: role => {
                    const { roles } = get();
                    return roles.includes(role);
                },

                hasAnyRole: roles => {
                    const { roles: userRoles } = get();
                    return roles.some(role => userRoles.includes(role));
                },

                updateUserProfile: async updates => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await fetch("/api/user/profile", {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${get().token}`,
                            },
                            body: JSON.stringify(updates),
                        });

                        if (!response.ok) {
                            throw new Error("Profile update failed");
                        }

                        const updatedUser = await response.json();
                        set(state => ({
                            user: { ...state.user, ...updatedUser },
                            isLoading: false,
                            error: null,
                        }));

                        return updatedUser;
                    } catch (error) {
                        set({ error: error.message, isLoading: false });
                        throw error;
                    }
                },

                checkSession: () => {
                    const { sessionTimeout, isAuthenticated } = get();
                    if (isAuthenticated && sessionTimeout && Date.now() > sessionTimeout) {
                        get()
                            .refreshAuth()
                            .catch(() => get().logout());
                    }
                },
            })),
            storeConfig
        ),
        { name: "auth-store" }
    )
);

// UI Store
export const useUIStore = create(
    devtools(
        persist(
            (set, get) => ({
                // State
                theme: "light",
                sidebarOpen: true,
                notifications: [],
                modals: {},
                loading: {},
                breadcrumbs: [],

                // Actions
                setTheme: theme => set({ theme }),
                toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
                setSidebarOpen: open => set({ sidebarOpen: open }),

                addNotification: notification => {
                    const id = Date.now().toString();
                    const newNotification = { ...notification, id };
                    set(state => ({
                        notifications: [...state.notifications, newNotification],
                    }));

                    // Auto-remove notification after 5 seconds
                    setTimeout(() => {
                        get().removeNotification(id);
                    }, 5000);
                },

                removeNotification: id => {
                    set(state => ({
                        notifications: state.notifications.filter(n => n.id !== id),
                    }));
                },

                clearNotifications: () => set({ notifications: [] }),

                openModal: (name, data) => {
                    set(state => ({
                        modals: {
                            ...state.modals,
                            [name]: { open: true, data },
                        },
                    }));
                },

                closeModal: name => {
                    set(state => ({
                        modals: {
                            ...state.modals,
                            [name]: { open: false, data: null },
                        },
                    }));
                },

                setLoading: (key, loading) => {
                    set(state => ({
                        loading: {
                            ...state.loading,
                            [key]: loading,
                        },
                    }));
                },

                setBreadcrumbs: breadcrumbs => set({ breadcrumbs }),
            }),
            storeConfig
        ),
        { name: "ui-store" }
    )
);

// Application Store
export const useAppStore = create(
    devtools(
        (set, get) => ({
            // State
            currentPath: "/",
            previousPath: null,
            pageTitle: "TalentSphere",
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",

            // Actions
            setCurrentPath: path => {
                const { currentPath } = get();
                set({
                    previousPath: currentPath,
                    currentPath: path,
                });
            },

            setPageTitle: title => set({ pageTitle: title }),
        }),
        { name: "app-store" }
    )
);

// Learning Management Store
export const useLmsStore = create(
    devtools(
        persist(
            (set, get) => ({
                // State
                courses: [],
                currentCourse: null,
                lessons: [],
                currentLesson: null,
                progress: {},
                enrollments: [],
                certificates: [],
                loading: false,
                error: null,

                // Actions
                setLoading: loading => set({ loading }),
                setError: error => set({ error }),

                fetchCourses: async () => {
                    set({ loading: true, error: null });
                    try {
                        const response = await fetch("/api/lms/courses");
                        if (!response.ok) throw new Error("Failed to fetch courses");
                        const courses = await response.json();
                        set({ courses, loading: false });
                        return courses;
                    } catch (error) {
                        set({ error: error.message, loading: false });
                        throw error;
                    }
                },

                fetchCourse: async id => {
                    set({ loading: true, error: null });
                    try {
                        const response = await fetch(`/api/lms/courses/${id}`);
                        if (!response.ok) throw new Error("Failed to fetch course");
                        const course = await response.json();
                        set({ currentCourse: course, loading: false });
                        return course;
                    } catch (error) {
                        set({ error: error.message, loading: false });
                        throw error;
                    }
                },

                enrollInCourse: async courseId => {
                    try {
                        const response = await fetch("/api/lms/enrollments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ courseId }),
                        });
                        if (!response.ok) throw new Error("Enrollment failed");
                        const enrollment = await response.json();
                        set(state => ({
                            enrollments: [...state.enrollments, enrollment],
                        }));
                        return enrollment;
                    } catch (error) {
                        set({ error: error.message });
                        throw error;
                    }
                },

                updateProgress: async (lessonId, progress) => {
                    try {
                        const response = await fetch(`/api/lms/progress/${lessonId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ progress }),
                        });
                        if (!response.ok) throw new Error("Failed to update progress");
                        const updatedProgress = await response.json();
                        set(state => ({
                            progress: { ...state.progress, [lessonId]: updatedProgress },
                        }));
                        return updatedProgress;
                    } catch (error) {
                        set({ error: error.message });
                        throw error;
                    }
                },
            }),
            storeConfig
        ),
        { name: "lms-store" }
    )
);

// Challenge/Competition Store
export const useChallengeStore = create(
    devtools(
        persist(
            (set, get) => ({
                // State
                challenges: [],
                currentChallenge: null,
                submissions: [],
                leaderboard: [],
                userSubmissions: [],
                loading: false,
                error: null,

                // Actions
                setLoading: loading => set({ loading }),
                setError: error => set({ error }),

                fetchChallenges: async (filters = {}) => {
                    set({ loading: true, error: null });
                    try {
                        const queryString = new URLSearchParams(filters).toString();
                        const response = await fetch(`/api/challenges?${queryString}`);
                        if (!response.ok) throw new Error("Failed to fetch challenges");
                        const challenges = await response.json();
                        set({ challenges, loading: false });
                        return challenges;
                    } catch (error) {
                        set({ error: error.message, loading: false });
                        throw error;
                    }
                },

                fetchChallenge: async id => {
                    set({ loading: true, error: null });
                    try {
                        const response = await fetch(`/api/challenges/${id}`);
                        if (!response.ok) throw new Error("Failed to fetch challenge");
                        const challenge = await response.json();
                        set({ currentChallenge: challenge, loading: false });
                        return challenge;
                    } catch (error) {
                        set({ error: error.message, loading: false });
                        throw error;
                    }
                },

                submitSolution: async (challengeId, solution) => {
                    try {
                        const response = await fetch(`/api/challenges/${challengeId}/submit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ solution }),
                        });
                        if (!response.ok) throw new Error("Submission failed");
                        const submission = await response.json();
                        set(state => ({
                            userSubmissions: [...state.userSubmissions, submission],
                        }));
                        return submission;
                    } catch (error) {
                        set({ error: error.message });
                        throw error;
                    }
                },

                fetchLeaderboard: async challengeId => {
                    try {
                        const response = await fetch(`/api/challenges/${challengeId}/leaderboard`);
                        if (!response.ok) throw new Error("Failed to fetch leaderboard");
                        const leaderboard = await response.json();
                        set({ leaderboard });
                        return leaderboard;
                    } catch (error) {
                        set({ error: error.message });
                        throw error;
                    }
                },
            }),
            storeConfig
        ),
        { name: "challenge-store" }
    )
);

// Analytics Store
export const useAnalyticsStore = create(
    devtools(
        (set, get) => ({
            // State
            metrics: {},
            events: [],
            userStats: null,
            performanceMetrics: [],
            loading: false,
            error: null,

            // Actions
            setLoading: loading => set({ loading }),
            setError: error => set({ error }),

            trackEvent: (eventName, data) => {
                const event = {
                    id: Date.now(),
                    name: eventName,
                    data,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                };

                set(state => ({
                    events: [...state.events, event],
                }));

                // Send to analytics service
                fetch("/api/analytics/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(event),
                }).catch(error => {
                    console.error("Failed to track event:", error);
                });
            },

            fetchMetrics: async timeRange => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/analytics/metrics?range=${timeRange}`);
                    if (!response.ok) throw new Error("Failed to fetch metrics");
                    const metrics = await response.json();
                    set({ metrics, loading: false });
                    return metrics;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            fetchUserStats: async () => {
                try {
                    const response = await fetch("/api/analytics/user-stats");
                    if (!response.ok) throw new Error("Failed to fetch user stats");
                    const stats = await response.json();
                    set({ userStats: stats });
                    return stats;
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            recordPerformanceMetric: metric => {
                const performanceMetric = {
                    ...metric,
                    timestamp: Date.now(),
                };

                set(state => ({
                    performanceMetrics: [...state.performanceMetrics, performanceMetric],
                }));
            },
        }),
        { name: "analytics-store" }
    )
);

// Store hooks and utilities
export const useStore = storeName => {
    const stores = {
        auth: useAuthStore,
        ui: useUIStore,
        app: useAppStore,
        lms: useLmsStore,
        challenge: useChallengeStore,
        analytics: useAnalyticsStore,
    };

    return stores[storeName] || useAppStore;
};

// Global store management
export const resetAllStores = () => {
    useAuthStore.getState().logout();
    useUIStore.setState({
        theme: "light",
        sidebarOpen: true,
        notifications: [],
        modals: {},
        loading: {},
        breadcrumbs: [],
    });
    useAppStore.setState({
        currentPath: "/",
        previousPath: null,
        pageTitle: "TalentSphere",
    });
    useLmsStore.setState({
        courses: [],
        currentCourse: null,
        lessons: [],
        currentLesson: null,
        progress: {},
        enrollments: [],
        certificates: [],
    });
    useChallengeStore.setState({
        challenges: [],
        currentChallenge: null,
        submissions: [],
        leaderboard: [],
        userSubmissions: [],
    });
    useAnalyticsStore.setState({
        metrics: {},
        events: [],
        userStats: null,
        performanceMetrics: [],
    });
};

// Initialize store sync between stores
export const initializeStoreSync = () => {
    // Sync auth state with other stores
    useAuthStore.subscribe(
        state => state.isAuthenticated,
        isAuthenticated => {
            if (!isAuthenticated) {
                resetAllStores();
            }
        }
    );

    // Check session timeout periodically
    setInterval(() => {
        useAuthStore.getState().checkSession();
    }, 60000); // Check every minute
};

export default {
    useAuthStore,
    useUIStore,
    useAppStore,
    useLmsStore,
    useChallengeStore,
    useAnalyticsStore,
    useStore,
    resetAllStores,
    initializeStoreSync,
};
