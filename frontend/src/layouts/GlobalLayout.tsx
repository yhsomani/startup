import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearch } from './components/GlobalSearch';
import './GlobalLayout.css';

export const GlobalLayout: React.FC = () => {
    const { user } = useAuth();
    const role = (user as any)?.role || (user as any)?.user_type || 'DEVELOPER';

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Unify on Deep Space Theme (Dark)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }, []);

    return (
        <div className="layout-container min-h-screen text-slate-200">
            <Topbar 
                setSidebarOpen={setSidebarOpen} 
                setSearchOpen={setSearchOpen} 
            />

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
                <Sidebar 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    role={role} 
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto page-content custom-scrollbar">
                    <div className="container py-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            <GlobalSearch 
                searchOpen={searchOpen} 
                setSearchOpen={setSearchOpen} 
            />
        </div>
    );
};
