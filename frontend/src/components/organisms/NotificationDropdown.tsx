import React, { useState, useEffect, useRef } from 'react';
import { Bell, Briefcase, BookOpen, Trophy, MessageCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';

interface Notification {
    id: string;
    type: 'job' | 'course' | 'achievement' | 'message' | 'system';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const iconMap = {
    job: { icon: <Briefcase size={20} />, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-500', border: 'border-emerald-500/20 dark:border-emerald-500/30' },
    course: { icon: <BookOpen size={20} />, bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-500', border: 'border-purple-500/20 dark:border-purple-500/30' },
    achievement: { icon: <Trophy size={20} />, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-500', border: 'border-amber-500/20 dark:border-amber-500/30' },
    message: { icon: <MessageCircle size={20} />, bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-500', border: 'border-blue-500/20 dark:border-blue-500/30' },
    system: { icon: <AlertCircle size={20} />, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20 dark:border-indigo-500/30' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '2', type: 'system', title: 'Security update available', message: 'Your account security settings require a brief review.', time: '2m ago', read: false },
    { id: '1', type: 'job', title: 'New Job Match', message: 'Sarah applied for Frontend Engineer: A new application matching your open position is ready for review.', time: '15m ago', read: false },
    { id: '3', type: 'message', title: 'New Connection', message: 'Marcus sent you a request: Marcus (Lead UI Designer) wants to connect.', time: '1h ago', read: false },
    { id: '4', type: 'course', title: 'Course Update', message: 'New lesson added to Advanced TypeScript.', time: '3h ago', read: true },
];

export const NotificationDropdown: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/api/v1/notifications');
                if (res.data?.notifications?.length) {
                    setNotifications(res.data.notifications);
                }
            } catch {
                // use mock fallback silently
            }
        };
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try { await api.put('/api/v1/notifications/read-all'); } catch { /* noop */ }
    };

    const markRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try { await api.put(`/api/v1/notifications/${id}/read`); } catch { /* noop */ }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="relative flex items-center justify-center rounded-lg h-10 w-10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#5211d4]/20 transition-all focus:ring-2 focus:ring-[#5211d4]/50 outline-none"
                aria-label="Notifications"
                aria-expanded={open}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-[400px] bg-white/95 dark:bg-[#161022]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-[#5211d4]/20 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#5211d4]/20">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-indigo-600 dark:text-[#5211d4] text-xs font-semibold hover:underline bg-indigo-50 dark:bg-[#5211d4]/10 px-2 py-1 rounded transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[480px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                                <Bell size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n, index) => {
                                const style = iconMap[n.type];
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        className={cn(
                                            'flex items-start gap-4 p-4 transition-colors cursor-pointer group relative',
                                            index > 0 && 'border-t border-slate-100 dark:border-slate-800/50',
                                            n.read
                                                ? 'hover:bg-slate-50 dark:hover:bg-white/5'
                                                : 'bg-indigo-50/50 dark:bg-[#5211d4]/5 hover:bg-indigo-50 dark:hover:bg-[#5211d4]/10'
                                        )}
                                    >
                                        <div className={cn('flex items-center justify-center rounded-xl shrink-0 size-12 border', style.bg, style.text, style.border)}>
                                            {style.icon}
                                        </div>
                                        <div className="flex flex-col flex-1 gap-0.5">
                                            <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-snug group-hover:text-indigo-600 dark:group-hover:text-[#8a5eff] transition-colors line-clamp-1">
                                                {n.title}
                                            </p>
                                            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium mt-1 uppercase tracking-wider">
                                                {n.time}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="shrink-0 pt-1.5">
                                                <div className="size-2 rounded-full bg-indigo-600 dark:bg-[#5211d4] shadow-[0_0_8px_rgba(82,17,212,0.8)]"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-[#5211d4]/20 text-center bg-slate-50 dark:bg-transparent">
                        <button className="text-slate-600 dark:text-slate-400 text-sm font-semibold hover:text-indigo-600 dark:hover:text-[#8a5eff] transition-colors">
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
