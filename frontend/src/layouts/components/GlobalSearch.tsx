import React, { useRef, useEffect, useState } from 'react';
import { Search, Loader2, ArrowUpRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import api from '../../services/api';

interface GlobalSearchProps {
    searchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ searchOpen, setSearchOpen }) => {
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ jobs: any[], profiles: any[] }>({ jobs: [], profiles: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults({ jobs: [], profiles: [] });
                return;
            }
            setIsSearching(true);
            try {
                const res = await api.get(`/api/v1/search?q=${searchQuery}`);
                setSearchResults({
                    jobs: res.data?.jobs || [],
                    profiles: res.data?.profiles || []
                });
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setSearchOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        if (searchOpen) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [searchOpen, setSearchOpen]);

    if (!searchOpen) return null;

    const filters = ['All', 'Talent', 'Jobs', 'Companies'];

    const filteredJobs = activeFilter === 'All' || activeFilter === 'Jobs' ? searchResults.jobs : [];
    const filteredProfiles = activeFilter === 'All' || activeFilter === 'Talent' ? searchResults.profiles : [];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 dark:bg-[#0a0f14]/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={searchRef}
                className="w-full max-w-2xl bg-white/95 dark:bg-[#101922]/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(37,140,244,0.1)] flex flex-col animate-in slide-in-from-top-4 duration-300"
            >
                {/* Search Header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#258cf4]/50 focus-within:shadow-[0_0_15px_rgba(37,140,244,0.3)] transition-all duration-200">
                    <Search className="text-slate-400" size={24} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search talent, jobs, or companies..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-500 font-normal focus:ring-0 px-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hidden sm:flex">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ESC</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {/* Filters */}
                    <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-transparent">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    activeFilter === f
                                        ? "bg-[#258cf4] text-white"
                                        : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-700/50"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {isSearching ? (
                        <div className="p-16 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-[#258cf4]" size={32} />
                            <span className="text-sm text-slate-500">Searching across the platform...</span>
                        </div>
                    ) : searchQuery.length > 0 ? (
                        <div className="px-2 pb-6">
                            {(filteredJobs.length > 0 || filteredProfiles.length > 0) ? (
                                <>
                                    <h3 className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Results</h3>
                                    
                                    {/* Jobs */}
                                    {filteredJobs.map(job => (
                                        <div key={job.id} onClick={() => { navigate(`/jobs/${job.id}`); setSearchOpen(false); }} className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#258cf4]/10 group cursor-pointer transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-lg bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[#258cf4]">work</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-[#258cf4] transition-colors">{job.title}</span>
                                                    <span className="text-xs text-slate-500">{job.company} • {job.location}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Job</span>
                                                <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#258cf4] transition-all" />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Profiles */}
                                    {filteredProfiles.map(p => (
                                        <div key={p.id} onClick={() => { navigate(`/profile/${p.id}`); setSearchOpen(false); }} className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#258cf4]/10 group cursor-pointer transition-colors mt-1">
                                            <div className="flex items-center gap-4">
                                                <div className="relative size-10 rounded-full bg-purple-50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{p.initials}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-[#258cf4] transition-colors">{p.name}</span>
                                                    <span className="text-xs text-slate-500">{p.role} @ {p.company}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Talent</span>
                                                <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#258cf4] transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="p-16 text-center">
                                    <Search size={32} className="mx-auto mb-3 opacity-20 dark:opacity-40 text-slate-500" />
                                    <span className="text-sm text-slate-500">No results found for "{searchQuery}" in {activeFilter}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-2 pb-4 pt-2">
                            <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Searches</h3>
                            
                            {/* Mock Recent Searches */}
                            {['React Developer', 'Stripe', 'Senior Product Designer'].map((term, i) => (
                                <div key={i} onClick={() => setSearchQuery(term)} className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#258cf4]/10 group cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <History className="text-slate-400 dark:text-slate-500 group-hover:text-[#258cf4] transition-colors" size={18} />
                                        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{term}</span>
                                    </div>
                                    <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#258cf4] transition-all" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Command Footer */}
                <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between hidden sm:flex border-b-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                            <span>to navigate</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <div className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">enter</div>
                            <span>to select</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <div className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">esc</div>
                        <span>to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
