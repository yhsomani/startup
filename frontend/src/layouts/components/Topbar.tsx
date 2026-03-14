import React from 'react';
import { Menu, Search, Sparkles, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../../components/organisms/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
    setSidebarOpen: (open: boolean) => void;
    setSearchOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setSidebarOpen, setSearchOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="topbar sticky top-0">
            <div className="topbar-container max-w-full px-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-white/5"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="logo-icon flex items-center justify-center text-white">
                            <Sparkles size={18} />
                        </div>
                        <span className="logo hidden sm:block">TalentSphere</span>
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 max-w-xl mx-12 px-5 py-2.5 bg-black/30 border border-white/5 rounded-2xl items-center gap-4 cursor-pointer hover:border-[var(--color-primary)]/40 hover:bg-black/40 transition-all group" onClick={() => setSearchOpen(true)}>
                    <Search size={18} className="text-slate-500 group-hover:text-[var(--color-secondary)] transition-colors" />
                    <span className="text-sm font-bold text-slate-500 flex-1 italic uppercase tracking-wider">Initiate Quantum Search...</span>
                    <div className="flex gap-1.5 opacity-40">
                        <kbd className="px-2 py-0.5 rounded-lg border border-white/20 bg-black/40 text-[10px] font-black text-slate-400 tracking-tighter">CTRL</kbd>
                        <kbd className="px-2 py-0.5 rounded-lg border border-white/20 bg-black/40 text-[10px] font-black text-slate-400 tracking-tighter">K</kbd>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <NotificationDropdown />

                    <div className="h-6 w-px bg-white/10 mx-1"></div>

                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px] hover:scale-110 transition-transform shadow-lg shadow-[var(--color-primary)]/20">
                            <div className="w-full h-full rounded-full bg-[#050510] flex items-center justify-center text-slate-200 overflow-hidden">
                                {(user as any)?.avatar ? (
                                    <img src={(user as any).avatar} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Abort Mission"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
