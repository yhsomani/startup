import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, Flame, Search, 
    Terminal, 
    Award, CheckCircle,
    Zap, Activity, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface Challenge {
    id: string;
    title: string;
    points: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    acceptance: string;
    tags: string[];
    completed?: boolean;
}

const difficultyVariant: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const ChallengeHubPage: React.FC = () => {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDifficulty, setActiveDifficulty] = useState<string>('All Node Types');

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                setLoading(true);
                const params: any = {};
                if (searchQuery) params.search = searchQuery;
                if (activeDifficulty !== 'All Node Types') params.difficulty = activeDifficulty;

                const res = await api.get('/api/v1/challenges', { params }).catch(() => null);
                setChallenges(res?.data?.challenges || []);
            } catch (err) {
                console.error('Failed to fetch challenges', err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchChallenges, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeDifficulty]);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 px-4 sm:px-0"
        >
            {/* Atmospheric Background elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[15%] left-[-5%] w-[500px] h-[500px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[#13ecec]/05 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            {/* Neural Arena Header */}
            <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-2xl bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#13ecec]/05 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <div className="p-4 rounded-2xl bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/20 shadow-lg">
                                <Terminal size={28} />
                            </div>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.3em] italic">Algorithm Matrix Active V4.2</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white text-7xl tracking-tighter m-0 italic lg:leading-[0.9]">
                                Neural Arena_
                            </Typography>
                            <p className="text-slate-400 text-xl font-medium italic leading-relaxed max-w-2xl opacity-90 mx-auto md:mx-0">
                                Stress-test your cognitive architecture. Resolve complex algorithmic nodes to ascend the global leaderboard.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 glass-panel p-8 rounded-[3rem] border-white/5 backdrop-blur-3xl shadow-2xl bg-black/20">
                        <div className="size-16 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.15)] flex items-center justify-center">
                            <Flame size={32} className="animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <Typography variant="h3" className="text-white mb-0 italic tracking-tighter text-2xl">7-Day Burn_</Typography>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Streak Synchronized</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Main Content Area (8 cols) */}
                <div className="xl:col-span-8 space-y-10">
                    
                    {/* Filter Convergence */}
                    <motion.div variants={itemVariants} className="glass-panel p-2 rounded-[3rem] border-white/10 flex flex-col lg:flex-row gap-4 items-center bg-black/40 backdrop-blur-3xl shadow-2xl">
                        <div className="relative flex-1 w-full bg-black/20 rounded-[2.5rem] flex items-center group">
                            <Search className="text-[#8c25f4] ml-8 group-focus-within:text-[#13ecec] transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="Identify problem signature..."
                                className="w-full bg-transparent border-none py-7 pl-6 pr-8 text-white placeholder:text-slate-700 font-black text-xs uppercase tracking-widest italic outline-none focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 p-2 bg-black/40 rounded-[2.5rem] border border-white/5 overflow-x-auto no-scrollbar">
                            {['All Node Types', 'Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setActiveDifficulty(d)}
                                    className={cn(
                                        "px-8 py-5 rounded-3xl text-[10px] font-black tracking-widest transition-all uppercase italic border border-transparent whitespace-nowrap", 
                                        activeDifficulty === d 
                                            ? "bg-[#8c25f4] text-white border-[#8c25f4]/30 shadow-2xl shadow-[#8c25f4]/20" 
                                            : "text-slate-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Challenge Matrix */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl bg-black/40">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-12 py-8 border-b border-white/5 bg-black/20 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
                            <div className="col-span-1">Status</div>
                            <div className="col-span-6">Node Identifier</div>
                            <div className="col-span-2">Affinity Score</div>
                            <div className="col-span-2">Complexity</div>
                            <div className="col-span-1 text-right">Yield</div>
                        </div>

                        <div className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-24 animate-pulse bg-white/5 mx-6 my-4 rounded-3xl" />
                                ))
                            ) : challenges.length > 0 ? (
                                challenges.map((challenge) => (
                                    <motion.div
                                        key={challenge.id}
                                        whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.02)' }}
                                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-12 py-8 items-center transition-all cursor-pointer group"
                                    >
                                        <div className="md:col-span-1 hidden md:flex">
                                            {challenge.completed ? (
                                                <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                                    <CheckCircle size={20} />
                                                </div>
                                            ) : (
                                                <div className="size-10 rounded-2xl border-2 border-slate-900 group-hover:border-[#8c25f4]/40 transition-all flex items-center justify-center">
                                                    <div className="size-2 bg-slate-900 rounded-full group-hover:bg-[#8c25f4]/20 transition-all" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-6 space-y-3">
                                            <h3 className="text-xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-colors">{challenge.title}_</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {challenge.tags.map(tag => (
                                                    <span key={tag} className="text-[9px] bg-white/5 border border-white/5 text-slate-500 px-3 py-1 rounded-xl uppercase font-black italic tracking-widest group-hover:text-slate-400 transition-colors">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 hidden md:block">
                                            <span className="text-xs font-black text-slate-600 italic uppercase tracking-widest">{challenge.acceptance}</span>
                                        </div>
                                        <div className="md:col-span-2 hidden md:block">
                                            <span className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic border", difficultyVariant[challenge.difficulty])}>
                                                {challenge.difficulty} SEQ
                                            </span>
                                        </div>
                                        <div className="md:col-span-1 hidden md:flex justify-end text-lg font-black text-[#13ecec] italic tracking-tighter">
                                            +{challenge.points}_
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-40 text-center space-y-8 flex flex-col items-center border-white/5 border-dashed border-2 m-10 rounded-[3rem]">
                                    <Cpu size={80} className="text-slate-800 animate-pulse" />
                                    <div className="space-y-2">
                                        <Typography variant="h2" className="text-slate-700 italic tracking-tighter m-0">Zero Challenges Detected_</Typography>
                                        <p className="text-slate-700 text-xs font-black uppercase tracking-[0.3em] italic">Algorithm Matrix Sync Incomplete</p>
                                    </div>
                                    <Button variant="ghost" className="italic text-[10px] font-black uppercase tracking-[0.4em]" onClick={() => { setSearchQuery(''); setActiveDifficulty('All Node Types'); }}>
                                        RESET MATRIX SCAN_
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </div>

                {/* Sidebar Intelligence (4 cols) */}
                <div className="xl:col-span-4 space-y-12">
                    {/* Performance Profile */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3.5rem] border-white/5 space-y-12 relative overflow-hidden group bg-black/40 shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity rotate-12">
                            <Trophy size={140} className="text-[#8c25f4]" />
                        </div>
                        
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="size-32 rounded-[3.5rem] bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2.5px] shadow-[0_0_50px_rgba(140,37,244,0.3)] group-hover:rotate-12 transition-transform duration-1000 relative">
                                <div className="w-full h-full rounded-[3.4rem] bg-[#050510] flex items-center justify-center">
                                    <Typography variant="h1" className="text-[#13ecec] m-0 text-5xl">42_</Typography>
                                </div>
                                <div className="absolute -bottom-2 -right-2 size-10 bg-[#13ecec] rounded-2xl border-4 border-[#050510] flex items-center justify-center text-black shadow-lg">
                                    <Zap size={18} className="fill-current" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Typography variant="h3" className="mb-0 italic tracking-tighter text-3xl">Yield Synchronized_</Typography>
                                <p className="text-[10px] font-black text-[#8c25f4] uppercase tracking-[0.3em] italic">Efficiency Growth: +15.4%</p>
                            </div>
                        </div>

                        <div className="space-y-8 pt-6 border-t border-white/5">
                            {[
                                { label: 'Easy Nodes', count: 24, total: 80, color: '#10b981' },
                                { label: 'Medium Nodes', count: 15, total: 160, color: '#f59e0b' },
                                { label: 'Expert Nodes', count: 3, total: 40, color: '#ef4444' }
                            ].map(stat => (
                                <div key={stat.label} className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-500">
                                        <span>{stat.label}</span>
                                        <span className="text-white">{stat.count} / {stat.total}</span>
                                    </div>
                                    <div className="h-2.5 bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.count / stat.total) * 100}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full rounded-full" 
                                            style={{ backgroundColor: stat.color, boxShadow: `0 0 15px ${stat.color}60` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Elite Contest Module */}
                    <motion.section 
                        variants={itemVariants} 
                        className="relative rounded-[3.5rem] p-12 overflow-hidden group cursor-pointer border-2 border-[#8c25f4]/40 shadow-[0_0_80px_-20px_rgba(140,37,244,0.3)] bg-black/40"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/30 to-[#050510] opacity-90 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute top-0 right-0 p-12 opacity-20 transform group-hover:-rotate-[30deg] group-hover:scale-125 transition-all duration-1000">
                            <Award size={180} className="text-white" />
                        </div>
                        
                        <div className="relative z-10 space-y-10">
                            <div className="px-6 py-2 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl inline-flex items-center gap-3">
                                <Activity size={16} className="text-[#13ecec] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white">Grid Signal Detected</span>
                            </div>
                            <div className="space-y-4">
                                <Typography variant="h2" className="text-white text-4xl mb-0 italic tracking-tighter">Elite Grid 350_</Typography>
                                <p className="text-white/60 text-lg font-medium italic leading-relaxed opacity-90">
                                    Global synchronization event. Top 1% gain exclusive <span className="text-white font-black italic uppercase text-[#13ecec] tracking-widest">Neural Badges</span>.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Button fullWidth size="lg" className="h-20 rounded-[1.5rem] shadow-2xl shadow-black/60 text-[11px] font-black italic uppercase tracking-[0.3em] bg-[#13ecec] text-black hover:bg-white transition-all">
                                    REGISTER SEQUENCE_
                                </Button>
                                <p className="text-center text-[9px] font-black text-white/40 uppercase tracking-[0.4em] italic mt-6">COMMENCING IN 2D 14H SYNC</p>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
};
