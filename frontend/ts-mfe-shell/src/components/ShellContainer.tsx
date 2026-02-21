import React, { ReactNode } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface ShellContainerProps {
    children?: ReactNode;
}

const ShellContainer: React.FC<ShellContainerProps> = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

    if (isAuthPage) {
        return <div className="shell-content">{children || <Outlet />}</div>;
    }

    return (
        <div className="shell-container min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
                <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
                    <a href="/" className="flex items-center">
                        <span className="self-center text-xl font-semibold whitespace-nowrap text-indigo-600">
                            TalentSphere
                        </span>
                    </a>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
                            <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                            <Link to="/courses" className="hover:text-indigo-600">Courses</Link>
                            <Link to="/challenges" className="hover:text-indigo-600">Challenges</Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationBell />

                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link to="/profile">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-sm text-gray-500 hover:text-gray-900"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600">Log in</Link>
                                    <Link to="/register" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg">Sign up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-16 p-4 max-w-screen-xl mx-auto">
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default ShellContainer;
