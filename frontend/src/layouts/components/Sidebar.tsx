import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Home, BookOpen, Code, Trophy, Users, Award, PlusCircle, MessageSquare, Sparkles, Settings, Clock, CreditCard, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItem {
    to: string;
    icon: React.ElementType;
    label: string;
    roles?: string[];
    exact?: boolean;
    badge?: number;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/', icon: Home, label: 'Dashboard', exact: true },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/applications', icon: Clock, label: 'Applications' },
    { to: '/network', icon: Users, label: 'Network' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', badge: 2 },
    { to: '/courses', icon: BookOpen, label: 'Learning' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/achievements', icon: Award, label: 'Achievements' },
    { to: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    role: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, role }) => {
    const location = useLocation();

    const isActive = (item: NavItem) => {
        if (item.exact) return location.pathname === item.to;
        return location.pathname.startsWith(item.to) && item.to !== '/';
    };

    const renderNavLink = (item: NavItem) => (
        <Link
            key={item.to}
            to={item.to}
            className={cn('nav-item group', isActive(item) && 'active')}
            onClick={() => setSidebarOpen(false)}
        >
            <item.icon size={20} className={cn('transition-all duration-300 group-hover:scale-110', isActive(item) ? 'text-white' : 'text-slate-500')} />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
                <span className="text-[9px] bg-[#8c25f4] text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center font-black animate-pulse shadow-lg shadow-[#8c25f4]/40">
                    {item.badge}
                </span>
            )}
        </Link>
    );

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 sidebar transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-6 md:hidden">
                    <span className="logo">TalentSphere</span>
                    <button className="ml-auto p-2 text-slate-400" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                </div>

                <nav className="flex-1 overflow-y-auto nav-menu custom-scrollbar py-8">
                    {NAV_ITEMS.map(renderNavLink)}

                    {/* Recruiter-only section */}
                    {(role === 'RECRUITER' || role === 'ADMIN' || role === 'recruiter') && (
                        <div className="mt-10 px-2">
                            <div className="px-5 mb-4">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Command Hub</span>
                            </div>
                            <Link to="/jobs/new" className="nav-item group" onClick={() => setSidebarOpen(false)}>
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <PlusCircle size={18} className="text-[#13ecec] group-hover:scale-110 transition-all duration-300" />
                                </div>
                                <span className="text-sm">Post Neural Job</span>
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-black/20">
                    {BOTTOM_NAV_ITEMS.map(renderNavLink)}
                </div>
            </aside>
        </>
    );
};
