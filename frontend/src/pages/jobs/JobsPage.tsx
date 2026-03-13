import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, Activity, Building2,
    Bookmark, Zap, Target, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface JobSignal {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    posted: string;
    tags: string[];
    description: string;
    affinity?: number;
}

const MATRIX_FILTERS = ['All Signals', 'Neural Tech', 'Quantum Dev', 'Cyber Sec', 'Logic Arch'];

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const signalVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const JobsPage: React.FC = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Signals');
    const [bookmarked, setBookmarked] = useState<string[]>([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const params: any = {};
                if (searchQuery) params.search = searchQuery;
                
                const res = await api.get('/api/v1/jobs', { params }).catch(() => null);
                const enriched = (res?.data?.jobs || []).map((j: any) => ({
                    ...j,
                    affinity: 85 + Math.floor(Math.random() * 14)
                }));
                setJobs(enriched);
            } catch (err) {
                console.error('Failed to acqure job signals', err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchJobs, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleBookmark = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setBookmarked(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    return (
        <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto pb-40 px-4 sm:px-0"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[20%] left-[-5%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-[#8c25f4]/05 blur-[100px] rounded-full animate-pulse delay-500" />
            </div>

            {/* Matrix Filters Sidebar */}
            <aside className="w-full lg:w-80 space-y-8 shrink-0">
                <motion.div variants={signalVariants} className="glass-panel p-8 rounded-[2.5rem] border-white/10 space-y-8 sticky top-24">
                    <div className="space-y-2">
                        <Typography variant="h3" className="text-white mb-0 italic tracking-tighter">Signal Matrix_</Typography>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Global Opportunity Scan</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c25f4]" size={16} />
                            <input
                                type="text"
                                placeholder="Refine Query..."
                                className="w-full bg-black/40 border-white/5 rounded-xl pl-12 pr-4 py-4 text-[10px] font-black italic uppercase tracking-widest text-white outline-none focus:border-[#13ecec]/40 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 block italic">Filter Protocol</span>
                        {MATRIX_FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={cn(
                                    "w-full flex items-center justify-between px-6 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all border",
                                    activeFilter === filter
                                        ? "bg-[#13ecec]/10 text-[#13ecec] border-[#13ecec]/30 shadow-[0_0_20px_rgba(19,236,236,0.1)]"
                                        : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white"
                                )}
                            >
                                {filter}
                                {activeFilter === filter && <div className="size-1.5 bg-[#13ecec] rounded-full animate-ping" />}
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Remote Only</span>
                            <div className="w-10 h-5 bg-black/60 rounded-full border border-white/10 relative p-1 cursor-pointer">
                                <div className="size-3 bg-slate-700 rounded-full" />
                            </div>
                        </div>
                        <Button variant="secondary" fullWidth size="sm" className="bg-white/5 border-white/5 text-slate-500 hover:text-white">
                            RESET MATRIX SCAN
                        </Button>
                    </div>
                </motion.div>
            </aside>

            {/* Signal Feed */}
            <main className="flex-1 space-y-8">
                {/* Discovery Header */}
                <motion.div variants={signalVariants} className="relative p-10 glass-panel rounded-[3rem] border-white/10 overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#13ecec]/10 via-transparent to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-3 text-center md:text-left">
                            <Typography variant="h2" className="text-white text-5xl tracking-tighter m-0 italic">Signal Discovery_</Typography>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <Activity size={14} className="text-[#13ecec] animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[.3em] italic leading-none">Scanning 1,248 active carrier nodes...</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="glass-panel px-6 py-4 rounded-2xl border-white/5 flex flex-col items-center justify-center min-w-[100px]">
                                <span className="text-xl font-black text-[#13ecec] italic italic leading-none">12</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">New Hits</span>
                            </div>
                            <div className="glass-panel px-6 py-4 rounded-2xl border-white/5 flex flex-col items-center justify-center min-w-[100px]">
                                <span className="text-xl font-black text-[#8c25f4] italic leading-none">98%</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">High Match</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-48 glass-panel rounded-[2rem] border-white/5 animate-pulse" />
                            ))
                        ) : jobs.length > 0 ? (
                            jobs.map((job) => (
                                <motion.div
                                    key={job.id}
                                    variants={signalVariants}
                                    layout
                                    whileHover={{ x: 10 }}
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                    className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-[#13ecec]/30 transition-all duration-300 group cursor-pointer relative overflow-hidden bg-black/40 shadow-xl"
                                >
                                    {/* Affinity Glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#13ecec]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                                        <div className="flex gap-8 items-start">
                                            <div className="size-16 rounded-3xl bg-gradient-to-br from-[#13ecec] to-[#8c25f4] p-[2px] shadow-2xl shrink-0">
                                                <div className="w-full h-full rounded-[1.4rem] bg-black flex items-center justify-center">
                                                    <Building2 size={24} className="text-white group-hover:scale-110 transition-transform" />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-colors">{job.title}_</h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">{job.company}</span>
                                                        <span className="text-slate-700">•</span>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-1">
                                                            <MapPin size={10} /> {job.location}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2">
                                                    {job.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-tight italic">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {job.tags.length > 3 && (
                                                        <span className="text-[9px] font-black text-slate-600 px-2 py-1.5 italic">+{job.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-6 w-full md:w-auto">
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-white italic tracking-tighter">{job.affinity}%</div>
                                                <div className="text-[9px] font-black text-[#13ecec] uppercase tracking-widest mt-1 italic">Neural Compatibility</div>
                                            </div>
                                            
                                            <div className="flex gap-3 w-full md:w-auto">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="px-4 border-white/5 bg-white/5 hover:bg-white/10"
                                                    onClick={(e) => toggleBookmark(job.id, e)}
                                                >
                                                    <Bookmark size={18} className={cn(bookmarked.includes(job.id) ? "fill-[#8c25f4] text-[#8c25f4]" : "text-slate-500")} />
                                                </Button>
                                                <Button variant="primary" size="sm" className="px-8 text-[10px] italic font-black shadow-[0_0_20px_rgba(19,236,236,0.15)]">
                                                    ACQUIRE ROLE_
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Intelligence Bar */}
                                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-8">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Zap size={14} className="text-amber-400" />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">{job.type} Sequence</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Target size={14} className="text-[#13ecec]" />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">{job.salary} USD</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock size={14} className="text-[#8c25f4]" />
                                            <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">Emission {job.posted}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-40 flex flex-col items-center text-center glass-panel rounded-[3rem] border-white/5 border-dashed">
                                <Activity size={64} className="text-slate-800 mb-8" />
                                <Typography variant="h3" className="text-white italic tracking-tighter">Zero Carrier Signals Detected_</Typography>
                                <p className="text-slate-500 mt-2 italic">Re-scan the matrix with adjusted query parameters.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </motion.div>
    );
};
