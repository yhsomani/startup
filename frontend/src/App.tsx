import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalLayout } from './layouts/GlobalLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegistrationPage } from './pages/auth/RegistrationPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { JobsPage } from './pages/jobs/JobsPage';
import { JobDetailsPage } from './pages/jobs/JobDetailsPage';
import { JobPostingFlowPage } from './pages/jobs/JobPostingFlowPage';
import { ApplicationsPage } from './pages/jobs/ApplicationsPage';
import { DeveloperDashboard } from './pages/dashboard/DeveloperDashboard';
import { RecruiterDashboard } from './pages/dashboard/RecruiterDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { CourseCatalogPage } from './pages/lms/CourseCatalogPage';
import { CourseDetailPage } from './pages/lms/CourseDetailPage';
import { VideoPlayerPage } from './pages/lms/VideoPlayerPage';
import { ChallengeHubPage } from './pages/challenges/ChallengeHubPage';
import { CodeEditorPage } from './pages/challenges/CodeEditorPage';
import { LeaderboardPage } from './pages/gamification/LeaderboardPage';
import { AchievementsPage } from './pages/gamification/AchievementsPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';
import { NetworkingPage } from './pages/networking/NetworkingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { MessagingPage } from './pages/messaging/MessagingPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { BillingPage } from './pages/billing/BillingPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/organisms/Toast';
import { ProtectedRoute } from './components/atoms/ProtectedRoute';

// Smart dashboard: redirect to the right dashboard based on role
const DashboardRedirect: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role || user?.user_type || 'DEVELOPER';
  if (role === 'RECRUITER' || role === 'recruiter') return <RecruiterDashboard />;
  if (role === 'ADMIN' || role === 'admin') return <AdminDashboard />;
  return <DeveloperDashboard />;
};

// TS-2024-003 Workaround: WebSocket connection with exponential backoff
const WebSocketNotificationListener: React.FC = () => {
  React.useEffect(() => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) return;

    let socket: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        socket = new WebSocket(`wss://api.talentsphere.com/socket?token=${accessToken}`);

        socket.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0; // Reset on success
        };

        socket.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            console.log('New notification:', notification);
            // In a real implementation, we would dispatch to Redux and show a toast
          } catch (e) { }
        };

        socket.onclose = () => {
          reconnectWithBackoff();
        };

        socket.onerror = () => {
          reconnectWithBackoff();
        };
      } catch (e) {
        reconnectWithBackoff();
      }
    };

    const reconnectWithBackoff = () => {
      // Exponential backoff: 1s, 2s, 4s, 8s... max 60s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
      reconnectAttempts++;
      
      console.log(`WebSocket disconnected. Reconnecting in ${delay/1000}s... (Attempt ${reconnectAttempts})`);
      
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING) {
          connect();
        }
      }, delay);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null; // Prevent reconnect loop on intentional unmount
        socket.close();
      }
    };
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <WebSocketNotificationListener />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected App Routes */}
            <Route path="/" element={<ProtectedRoute><GlobalLayout /></ProtectedRoute>}>
              {/* Dashboard — smart redirect by role */}
              <Route index element={<DashboardRedirect />} />
              <Route path="recruiter" element={<ProtectedRoute allowedRoles={['RECRUITER']}><RecruiterDashboard /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

              {/* Jobs */}
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/new" element={<ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><JobPostingFlowPage /></ProtectedRoute>} />
              <Route path="jobs/:id" element={<JobDetailsPage />} />

              {/* Applications Tracker */}
              <Route path="applications" element={<ApplicationsPage />} />

              {/* LMS */}
              <Route path="courses" element={<CourseCatalogPage />} />
              <Route path="courses/:id" element={<CourseDetailPage />} />
              <Route path="courses/:courseId/lesson/:lessonId" element={<VideoPlayerPage />} />

              {/* Challenges */}
              <Route path="challenges" element={<ChallengeHubPage />} />
              <Route path="challenges/:id/solve" element={<CodeEditorPage />} />

              {/* Gamification */}
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="achievements" element={<AchievementsPage />} />

              {/* Company */}
              <Route path="companies/:id" element={<CompanyProfilePage />} />

              {/* Networking & Social */}
              <Route path="network" element={<NetworkingPage />} />

              {/* Messaging */}
              <Route path="messages" element={<MessagingPage />} />

              {/* AI Assistant */}
              <Route path="ai-assistant" element={<AIAssistantPage />} />

              {/* Billing */}
              <Route path="billing" element={<BillingPage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />

              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Catch-all inside layout → 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Catch-all outside layout → 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
