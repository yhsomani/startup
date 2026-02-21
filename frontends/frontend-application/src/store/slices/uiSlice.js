/**
 * UI Slice
 * 
 * Redux Toolkit slice for UI state management
 * Handles theme, layout, modals, loading states, and UI preferences
 */

import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  theme: {
    mode: 'light', // light, dark, auto
    primaryColor: '#007bff',
    accentColor: '#28a745',
    fontSize: 'medium', // small, medium, large
    sidebarCollapsed: false,
    headerHeight: 60,
    sidebarWidth: 250,
  },
  layout: {
    sidebarOpen: true,
    headerVisible: true,
    footerVisible: true,
    breadcrumbs: [],
    activeTab: 'dashboard', // dashboard, jobs, profile, messages, analytics, settings
  },
  modals: {
    login: false,
    register: false,
    forgotPassword: false,
    resetPassword: false,
    profile: false,
    jobDetails: false,
    companyDetails: false,
    applicationForm: false,
    messageCompose: false,
    settings: false,
    confirm: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    },
    share: {
      isOpen: false,
      url: '',
      title: '',
      description: '',
    },
    imagePreview: {
      isOpen: false,
      src: '',
      alt: '',
      title: '',
    },
  },
  loading: {
    global: false,
    login: false,
    register: false,
    profile: false,
    jobs: false,
    messages: false,
    analytics: false,
  },
  notifications: {
    toast: [],
    alerts: [],
  },
  errors: {
    network: null,
    validation: {},
    api: null,
  },
  preferences: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    autoSave: true,
    notifications: {
      desktop: true,
      sound: true,
      position: 'top-right',
    },
  },
  shortcuts: {
    enabled: true,
    global: {
      'Ctrl+K': 'focusSearch',
      'Ctrl+/': 'openSettings',
      'Ctrl+D': 'darkMode',
      'Ctrl+N': 'newMessage',
    },
    navigation: {
      'Alt+ArrowLeft': 'previousPage',
      'Alt+ArrowRight': 'nextPage',
      'Alt+Up': 'scrollUp',
      'Alt+Down': 'scrollDown',
    },
  },
  dashboard: {
    widgets: [
      { id: 'overview', type: 'overview', visible: true, order: 1 },
      { id: 'recentJobs', type: 'recent-jobs', visible: true, order: 2 },
      { id: 'applicationStats', type: 'stats', visible: true, order: 3 },
      { id: 'savedJobs', type: 'saved-jobs', visible: true, order: 4 },
      { id: 'profileViews', type: 'chart', visible: true, order: 5 },
      { id: 'networkActivity', type: 'network', visible: false, order: 6 },
    ],
    charts: {
      profileViews: {
        type: 'line',
        period: '30d',
        data: [],
      },
      applicationStats: {
        type: 'bar',
        period: '30d',
        data: [],
      },
    },
  },
  help: {
    tour: {
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      skip: false,
    },
    tooltips: {
      enabled: true,
      delay: 1000,
      position: 'top',
    },
    search: {
      enabled: true,
      placeholder: 'Type to search...',
      suggestions: true,
    },
  },
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    toggleTheme: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.theme = { ...state.theme, ...action.payload };
    },
    toggleSidebar: (state) => {
      state.theme.sidebarCollapsed = !state.theme.sidebarCollapsed;
    },
    setSidebarOpen: (state, action) => {
      state.layout.sidebarOpen = action.payload;
    },
    
    // Layout actions
    setActiveTab: (state, action) => {
      state.layout.activeTab = action.payload;
      state.layout.breadcrumbs = [];
    },
    setBreadcrumbs: (state, action) => {
      state.layout.breadcrumbs = action.payload;
    },
    toggleHeader: (state) => {
      state.layout.headerVisible = !state.layout.headerVisible;
    },
    
    // Modal actions
    openModal: (state, action) => {
      const { modal, data } = action.payload;
      state.modals[modal] = { isOpen: true, ...data };
    },
    closeModal: (state, action) => {
      const { modal } = action.payload;
      if (typeof modal === 'string') {
        state.modals[modal] = { isOpen: false };
      } else {
        Object.keys(state.modals).forEach(key => {
          if (state.modals[key].isOpen) {
            state.modals[key].isOpen = false;
          }
        });
      }
    },
    openConfirmModal: (state, action) => {
      state.modals.confirm = {
        isOpen: true,
        title: action.payload.title || 'Confirm Action',
        message: action.payload.message || 'Are you sure you want to proceed?',
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel,
      };
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { type, isLoading } = action.payload;
      state.loading[type] = isLoading;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Error actions
    setError: (state, action) => {
      const { type, error } = action.payload;
      state.errors[type] = error;
    },
    clearError: (state, action) => {
      const { type } = action.payload;
      state.errors[type] = null;
    },
    clearAllErrors: (state) => {
      state.errors = initialState.errors;
    },
    
    // Notification actions
    addToast: (state, action) => {
      state.notifications.toast.push({
        id: Date.now().toString(),
        type: action.payload.type || 'info', // success, error, warning, info
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        persistent: action.payload.persistent || false,
        action: action.payload.action,
      });
    },
    removeToast: (state, action) => {
      state.notifications.toast = state.notifications.toast.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.notifications.toast = [];
    },
    addAlert: (state, action) => {
      state.notifications.alerts.push({
        id: Date.now().toString(),
        type: action.payload.type || 'warning',
        message: action.payload.message,
        persistent: action.payload.persistent || true,
        dismissible: action.payload.dismissible !== false,
      });
    },
    removeAlert: (state, action) => {
      state.notifications.alerts = state.notifications.alerts.filter(alert => alert.id !== action.payload);
    },
    
    // Preference actions
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    // Dashboard actions
    updateWidget: (state, action) => {
      const { id, updates } = action.payload;
      const widgetIndex = state.dashboard.widgets.findIndex(w => w.id === id);
      if (widgetIndex !== -1) {
        state.dashboard.widgets[widgetIndex] = {
          ...state.dashboard.widgets[widgetIndex],
          ...updates
        };
      }
    },
    
    // Tour actions
    startTour: (state, action) => {
      state.help.tour.isActive = true;
      state.help.tour.currentStep = action.payload.startStep || 0;
    },
    nextTourStep: (state) => {
      if (state.help.tour.isActive) {
        state.help.tour.currentStep += 1;
        state.help.tour.completedSteps.push(state.help.tour.currentStep - 1);
      }
    },
    skipTour: (state) => {
      state.help.tour.skip = true;
      state.help.tour.isActive = false;
    },
    completeTour: (state) => {
      state.help.tour.isActive = false;
      state.help.tour.completedSteps.push(state.help.tour.currentStep);
    },
    
    // Keyboard shortcuts
    executeShortcut: (state, action) => {
      // This would be handled by a keyboard shortcuts middleware
      // Just store the action for reference
      console.log(`Shortcut executed: ${action.payload}`);
    },
  },
});

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectLayout = (state) => state.ui.layout;
export const selectModals = (state) => state.ui.modals;
export const selectLoading = (state) => state.ui.loading;
export const selectErrors = (state) => state.ui.errors;
export const selectNotifications = (state) => state.ui.notifications;
export const selectPreferences = (state) => state.ui.preferences;
export const selectDashboard = (state) => state.ui.dashboard;
export const selectHelp = (state) => state.ui.help;

export default uiSlice.reducer;