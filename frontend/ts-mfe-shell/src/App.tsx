import React, { Suspense } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminPanel from "./components/AdminPanel";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import { GamificationDashboard } from "./components/GamificationDashboard";

// Auth
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Phase 10 Components
import { AIAssistant } from "./components/AIAssistant";
import { RecruiterDashboard } from "./components/RecruiterDashboard";

// Lazy load remotes
// @ts-ignore
const LMSApp = React.lazy(() => import("lms/App"));
// @ts-ignore
const ChallengeApp = React.lazy(() => import("challenge/App"));

// Navigation component with role-based items
const Navigation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, hasRole } = useAuth();
    const isAuthPage = location.pathname === "/register" || location.pathname === "/login";

    if (isAuthPage) return null;

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const navLinkStyle = { color: "#ccc", textDecoration: "none", padding: "0.5rem" };
    const activeLinkStyle = { ...navLinkStyle, color: "white", fontWeight: 600 };

    return (
        <nav
            style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}>
            <Link
                to="/"
                style={{
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    marginRight: "1rem",
                }}>
                🎓 TalentSphere
            </Link>

            {/* Public Links */}
            <Link
                to="/courses"
                style={location.pathname.startsWith("/courses") ? activeLinkStyle : navLinkStyle}>
                Courses
            </Link>
            <Link
                to="/challenges"
                style={
                    location.pathname.startsWith("/challenges") ? activeLinkStyle : navLinkStyle
                }>
                Challenges
            </Link>

            {/* Authenticated Links */}
            {isAuthenticated && (
                <>
                    <Link
                        to="/dashboard"
                        style={location.pathname === "/dashboard" ? activeLinkStyle : navLinkStyle}>
                        Dashboard
                    </Link>
                    <Link
                        to="/gamification"
                        style={location.pathname === "/gamification" ? activeLinkStyle : navLinkStyle}>
                        🏆 Achievements
                    </Link>
                </>
            )}

            {/* Instructor/Admin Links */}
            {hasRole(["INSTRUCTOR", "ADMIN"]) && (
                <Link
                    to="/courses/create"
                    style={
                        location.pathname === "/courses/create" ? activeLinkStyle : navLinkStyle
                    }>
                    📝 Instructor Studio
                </Link>
            )}

            {/* Recruiter/Admin Links */}
            {hasRole(["RECRUITER", "ADMIN"]) && (
                <Link
                    to="/recruiter"
                    style={location.pathname === "/recruiter" ? activeLinkStyle : navLinkStyle}>
                    👥 Recruiter
                </Link>
            )}

            {/* Admin Links */}
            {hasRole(["ADMIN"]) && (
                <>
                    <Link
                        to="/admin"
                        style={location.pathname === "/admin" ? activeLinkStyle : navLinkStyle}>
                        ⚙️ Admin
                    </Link>
                    <Link
                        to="/admin/performance"
                        style={location.pathname === "/admin/performance" ? activeLinkStyle : navLinkStyle}>
                        ⚡ Performance
                    </Link>
                </>
            )}

            {/* Auth Section */}
            <div
                style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                }}>
                {isAuthenticated ? (
                    <>
                        <Link
                            to="/profile"
                            data-testid="user-menu"
                            style={{
                                ...navLinkStyle,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}>
                            <span
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                }}>
                                {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </span>
                            <span data-testid="user-profile" style={{ fontSize: "0.875rem" }}>
                                {user?.firstName || user?.email}
                            </span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            data-testid="logout-button"
                            style={{
                                background: "transparent",
                                border: "1px solid #6b7280",
                                color: "#ccc",
                                padding: "0.4rem 0.75rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                            }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ color: "#ccc", textDecoration: "none" }} data-testid="login-button">
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            data-testid="register-button"
                            style={{
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "white",
                                padding: "0.5rem 1rem",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                            }}>
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

// Import AdminPanel
// import { AdminPanel } from './components/AdminPanel';

function AppContent() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const isAuthPage = ["/register", "/login", "/forgot-password", "/reset-password"].includes(
        location.pathname
    );

    return (
        <div className="shell-container">
            <Navigation />

            <div style={{ padding: isAuthPage ? 0 : "2rem", minHeight: "calc(100vh - 60px)" }}>
                <ErrorBoundary>
                    <Suspense
                        fallback={
                            <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
                        }>
                        <Routes>
                            {/* Public Routes */}
                            <Route
                                path="/"
                                element={
                                    <div style={{ textAlign: "center", marginTop: "4rem" }}>
                                        <h1
                                            style={{
                                                fontSize: "2.5rem",
                                                fontWeight: 700,
                                                marginBottom: "1rem",
                                            }}>
                                            Welcome to TalentSphere
                                        </h1>
                                        <p
                                            style={{
                                                color: "#6b7280",
                                                fontSize: "1.125rem",
                                                marginBottom: "2rem",
                                            }}>
                                            The next-generation learning platform.
                                        </p>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "1rem",
                                                justifyContent: "center",
                                            }}>
                                            <Link
                                                to="/courses"
                                                className="btn-primary"
                                                style={{
                                                    display: "inline-block",
                                                    textDecoration: "none",
                                                    padding: "1rem 2rem",
                                                }}>
                                                Browse Courses
                                            </Link>
                                            {!isAuthenticated && (
                                                <Link
                                                    to="/register"
                                                    style={{
                                                        display: "inline-block",
                                                        textDecoration: "none",
                                                        padding: "1rem 2rem",
                                                        border: "2px solid #4f46e5",
                                                        color: "#4f46e5",
                                                        borderRadius: "8px",
                                                        fontWeight: 600,
                                                    }}>
                                                    Get Started
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                }
                            />

                            {/* Auth Routes */}
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />

                            {/* Protected Routes - Require Authentication */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Public Course Routes */}
                            <Route path="/courses" element={<LMSApp />} />
                            <Route path="/courses/:courseId" element={<LMSApp />} />

                            {/* Protected Learning Route - Students only */}
                            <Route
                                path="/courses/:courseId/learn"
                                element={
                                    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                                        <LMSApp />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Instructor Studio - Instructors/Admins only */}
                            <Route
                                path="/courses/create"
                                element={
                                    <ProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN"]}>
                                        <LMSApp />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Public Challenge Routes */}
                            <Route path="/challenges" element={<ChallengeApp />} />
                            <Route path="/challenges/:challengeId" element={<ChallengeApp />} />

                            {/* Protected Profile Route */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Recruiter Route - Recruiters/Admins only */}
                            <Route
                                path="/recruiter"
                                element={
                                    <ProtectedRoute allowedRoles={["RECRUITER", "ADMIN"]}>
                                        <RecruiterDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin Route - Admins only */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                                        <AdminPanel />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin Performance Dashboard */}
                            <Route
                                path="/admin/performance"
                                element={
                                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                                        <PerformanceDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Gamification / Achievements — all authenticated users */}
                            <Route
                                path="/gamification"
                                element={
                                    <ProtectedRoute allowedRoles={["STUDENT", "INSTRUCTOR", "RECRUITER", "ADMIN"]}>
                                        <GamificationDashboard userId={""} />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>

            {/* Global AI Assistant Widget */}
            {!isAuthPage && <AIAssistant />}
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
