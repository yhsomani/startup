/**
 * Redux Store Configuration
 * 
 * Centralized state management using Redux Toolkit
 * with slices for different features and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { encryptTransform } from 'redux-persist-transform-encrypt';

// Import slices
import authSlice from './slices/authSlice';
import profileSlice from './slices/profileSlice';
import jobsSlice from './slices/jobsSlice';
import companiesSlice from './slices/companiesSlice';
import networkSlice from './slices/networkSlice';
import messagesSlice from './slices/messagesSlice';
import applicationsSlice from './slices/applicationsSlice';
import notificationsSlice from './slices/notificationsSlice';
import uiSlice from './slices/uiSlice';
import analyticsSlice from './slices/analyticsSlice';

// Encryption configuration for sensitive data
const encryptor = encryptTransform({
  secretKey: process.env.REACT_APP_ENCRYPTION_KEY || 'default-key',
  onError: function(error) {
    console.error('Redux persist encryption error:', error);
  },
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'auth', // User authentication state
    'profile', // User profile data
    'notifications', // Notification preferences
    'ui', // UI preferences like theme, language
  ],
  transforms: [encryptor],
  blacklist: [
    'messages', // Don't persist messages for privacy
    'applications', // Don't persist applications for data freshness
    'jobs', // Don't persist jobs for data freshness
    'companies', // Don't persist companies for data freshness
    'network', // Don't persist network for data freshness
    'analytics', // Don't persist analytics
  ],
};

// Configure store
const store = configureStore({
  reducer: {
    auth: persistReducer(persistConfig, authSlice),
    profile: persistReducer(persistConfig, profileSlice),
    jobs: jobsSlice,
    companies: companiesSlice,
    network: networkSlice,
    messages: messagesSlice,
    applications: applicationsSlice,
    notifications: persistReducer(persistConfig, notificationsSlice),
    ui: persistReducer(persistConfig, uiSlice),
    analytics: analyticsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['register'],
        ignoredPaths: ['register'],
      },
      immutableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
const persistor = persistStore(store);

export { store, persistor };

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;