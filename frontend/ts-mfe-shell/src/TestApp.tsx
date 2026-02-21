import React, { Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CourseBrowse from './pages/CourseBrowse';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import ChallengeList from './pages/ChallengeList';
import ChallengeDetail from './pages/ChallengeDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const TestApp: React.FC = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/register' || location.pathname === '/login';

    return (
        <div className="shell-container">
            {!isAuthPage && (
                <nav style={{ padding: '1rem', background: '#333', color: 'white', display: 'flex', gap: '1rem' }}>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>TalentSphere</Link>
                    <Link to="/courses" style={{ color: '#ccc', textDecoration: 'none' }}>Courses</Link>
                    <Link to="/challenges" style={{ color: '#ccc', textDecoration: 'none' }}>Challenges</Link>
                    <div style={{ marginLeft: 'auto' }}>
                        <Link to="/login" style={{ color: '#ccc', textDecoration: 'none', marginRight: '1rem' }}>Log In</Link>
                    </div>
                </nav>
            )}

            <div style={{ padding: isAuthPage ? 0 : '2rem' }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<div role="heading" aria-level={1}>Welcome to TalentSphere</div>} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/courses" element={<CourseBrowse />} />
                        <Route path="/courses/:courseId" element={<CourseDetail />} />
                        <Route path="/courses/:courseId/learn" element={<CoursePlayer />} />
                        <Route path="/challenges" element={<ChallengeList />} />
                        <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    );
};

export default TestApp;
