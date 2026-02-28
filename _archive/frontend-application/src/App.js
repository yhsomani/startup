/**
 * Main React App Component
 * Entry point for TalentSphere frontend application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy loaded components for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Jobs = React.lazy(() => import('./pages/Jobs/Jobs'));
const JobDetail = React.lazy(() => import('./pages/Jobs/JobDetail'));
const Companies = React.lazy(() => import('./pages/Companies/Companies'));
const CompanyDetail = React.lazy(() => import('./pages/Companies/CompanyDetail'));
const Network = React.lazy(() => import('./pages/Network/Network'));
const Messages = React.lazy(() => import('./pages/Messages/Messages'));
const Applications = React.lazy(() => import('./pages/Applications/Applications'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const VideoInterview = React.lazy(() => import('./pages/VideoInterview'));
const CompanyCulture = React.lazy(() => import('./pages/CompanyCulture'));

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066cc',
      light: '#3385ff',
      dark: '#0052a3',
    },
    secondary: {
      main: '#f50057',
      light: '#f53371',
      dark: '#c50e3d',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <WebSocketProvider>
                <AnalyticsProvider>
                  <Router>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={
                        <PublicRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Login />
                          </React.Suspense>
                        </PublicRoute>
                      } />
                      <Route path="/register" element={
                        <PublicRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Register />
                          </React.Suspense>
                        </PublicRoute>
                      } />

                      {/* Protected routes */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route index element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Dashboard />
                          </React.Suspense>
                        } />
                        <Route path="dashboard" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Dashboard />
                          </React.Suspense>
                        } />
                        <Route path="profile" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Profile />
                          </React.Suspense>
                        } />
                        <Route path="jobs" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Jobs />
                          </React.Suspense>
                        } />
                        <Route path="jobs/:id" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <JobDetail />
                          </React.Suspense>
                        } />
                        <Route path="companies" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Companies />
                          </React.Suspense>
                        } />
                        <Route path="companies/:id" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <CompanyDetail />
                          </React.Suspense>
                        } />
                        <Route path="network" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Network />
                          </React.Suspense>
                        } />
                        <Route path="messages" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Messages />
                          </React.Suspense>
                        } />
                        <Route path="applications" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Applications />
                          </React.Suspense>
                        } />
                        <Route path="settings" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <Settings />
                          </React.Suspense>
                        } />

                        {/* Video Service Routes */}
                        <Route path="interview/:roomId" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <VideoInterview />
                          </React.Suspense>
                        } />
                        <Route path="culture" element={
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <CompanyCulture />
                          </React.Suspense>
                        } />

                      </Route>

                      {/* Fallback route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Router>
                </AnalyticsProvider>
              </WebSocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;