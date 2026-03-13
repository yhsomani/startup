import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Target, TrendingUp, Activity, 
    ChevronRight, Lock, Unlock, Clock, 
    Sparkles, Brain, Code, Cpu 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface DashStats {
    profileViews: number;
    xp: number;
    streak: number;
    rank: string;
    score: number;
}

interface GrowthMilestone {
    label: string;
    xp: string;
    status: 'locked' | 'unlocked' | 'active';
}

const GROWTH_TRACK: GrowthMilestone[] = [
    { label: 'Full-Stack Architect', xp: '0', status: 'unlocked' },
    { label: 'System Design Guru', xp: '1,550 XP REQ', status: 'active' },
    { label: 'Staff Engineer', xp: '5,000 XP REQ', status: 'locked' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as any
        }
    }
};

export const DeveloperDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashStats>({
        profileViews: 1240,
        xp: 8450,
        streak: 7,
        rank: 'Master',
        score: 985
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const xpRes = await api.get('/api/v1/achievements').catch(() => null);
                if (xpRes?.data) {
                    setStats(prev => ({ ...prev, xp: xpRes.data.xp || 8450 }));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const name = user?.firstName || 'Alex';

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 w-full pb-12"
        >
            {/* Neural Hero Section */}
            <motion.section 
                variants={itemVariants}
                className="relative overflow-hidden p-8 md:p-12 glass-panel rounded-[2rem] border-white/10 group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/10 via-transparent to-[#13ecec]/5 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#13ecec]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#13ecec]/20 transition-colors duration-700" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="px-3 py-1 bg-[#13ecec]/10 rounded-full border border-[#13ecec]/30 flex items-center gap-2">
                                <Zap size={12} className="text-[#13ecec]" />
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-widest italic">Neural Connection Stable</span>
                            </div>
                            <div className="px-3 py-1 bg-[#8c25f4]/10 rounded-full border border-[#8c25f4]/30 flex items-center gap-2">
                                <Target size={12} className="text-[#8c25f4]" />
                                <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">Global Top 2.4%</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white">
                                Welcome, {name}_
                            </Typography>
                            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                                Your professional neural mesh is expanding. 
                                <span className="text-[#13ecec] font-black ml-2 bg-[#13ecec]/10 px-2 py-0.5 rounded italic">12 New Matches Detected</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
                        <div className="glass-panel border-white/10 p-6 rounded-3xl w-full lg:w-80 relative overflow-hidden group/stats">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/stats:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                        <motion.circle 
                                            cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" 
                                            strokeDasharray={226} 
                                            initial={{ strokeDashoffset: 226 }}
                                            animate={{ strokeDashoffset: 226 * (1 - 0.85) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="text-[#13ecec] drop-shadow-[0_0_8px_rgba(19,236,236,0.5)]" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-sm font-black text-white italic">85%</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Typography variant="label" className="text-[#8c25f4] mb-1">Matrix Progress</Typography>
                                    <p className="text-lg font-black text-white italic uppercase tracking-tighter truncate">{stats.rank}</p>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[10px] font-bold text-slate-500 italic">LVL 42</span>
                                        <span className="text-[10px] font-black text-[#13ecec] italic">{stats.xp.toLocaleString()} XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full lg:w-80"
                            onClick={() => navigate('/profile')}
                        >
                            Refine Matrix Interface
                        </Button>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Visibility', value: '1,240', trend: '+12%', icon: Activity, color: '#13ecec' },
                            { label: 'Neural Rank', value: '#4,092', trend: '+84', icon: Target, color: '#8c25f4' },
                            { label: 'Velocity', value: '3.2/wk', trend: 'Stable', icon: Zap, color: '#10b981' },
                            { label: 'Mastery', value: '985', trend: 'Top 1%', icon: Brain, color: '#f59e0b' },
                        ].map((metric, i) => (
                            <motion.div 
                                key={metric.label}
                                variants={itemVariants}
                                className="glass-panel p-6 rounded-3xl border-white/5 hover:border-[#8c25f4]/30 group/card transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 rounded-2xl bg-white/5 text-slate-400 group-hover/card:text-white group-hover/card:bg-[#8c25f4]/20 transition-all">
                                        <metric.icon size={20} />
                                    </div>
                                    <div className="text-[10px] font-black text-[#13ecec] italic bg-[#13ecec]/10 px-2 py-1 rounded">
                                        {metric.trend}
                                    </div>
                                </div>
                                <Typography variant="label" className="text-slate-500 mb-1">{metric.label}</Typography>
                                <div className="text-3xl font-black text-white italic tracking-tighter">{metric.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Growth Protocol Timeline */}
                    <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2rem] border-white/5">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <Cpu className="text-[#13ecec]" size={20} />
                                <Typography variant="h3">Growth Protocol</Typography>
                            </div>
                            <Button variant="ghost" size="sm" className="italic uppercase font-black text-[10px] tracking-widest">
                                Full Trajectory
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                            {GROWTH_TRACK.map((milestone, i) => (
                                <div key={milestone.label} className="relative">
                                    <div className={cn(
                                        "glass-panel p-6 rounded-3xl border-white/5 transition-all relative z-10",
                                        milestone.status === 'active' ? "border-[#13ecec]/40 bg-[#13ecec]/5" : "hover:border-white/10"
                                    )}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded italic",
                                                milestone.status === 'unlocked' ? "bg-emerald-500/10 text-emerald-400" : 
                                                milestone.status === 'active' ? "bg-[#13ecec]/20 text-[#13ecec]" : 
                                                "bg-slate-800 text-slate-500"
                                            )}>
                                                {milestone.status}
                                            </span>
                                            {milestone.status === 'locked' && <Lock size={12} className="text-slate-600" />}
                                            {milestone.status === 'unlocked' && <Unlock size={12} className="text-emerald-400" />}
                                        </div>
                                        <p className="text-white font-black italic uppercase tracking-tight mb-2">{milestone.label}</p>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{milestone.xp}</p>
                                    </div>
                                    {i < GROWTH_TRACK.length - 1 && (
                                        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[1px] bg-white/10 z-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Neural Activity Stream */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[2rem] border-white/5 overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="text-[#8c25f4]" size={20} />
                                <Typography variant="h3">System Activity</Typography>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { title: 'Algorithm Optimized: Matrix Sort', desc: 'Achieved O(n log n) efficiency in cinematic renderer.', time: '2h ago', icon: Code, color: 'text-[#13ecec]' },
                                { title: 'Neural PR Merged', desc: 'Integration of TalentSphere V2 design system core.', time: 'Yesterday', icon: GitMerge, color: 'text-[#8c25f4]' },
                                { title: 'Quantum Certification', desc: 'Neural Network Architect - Level 4 Verified.', time: '2 days ago', icon: Award, color: 'text-emerald-400' },
                            ].map((activity, i) => (
                                <div key={i} className="p-8 hover:bg-white/5 transition-all flex gap-6 cursor-pointer group">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-2xl border border-white/5",
                                        activity.color.replace('text', 'bg') + '/10',
                                        activity.color
                                    )}>
                                        <activity.icon size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-black text-white italic transition-colors group-hover:text-[#13ecec]">{activity.title}</h4>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{activity.time}</span>
                                        </div>
                                        <p className="text-slate-400 font-medium leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{activity.desc}</p>
                                    </div>
                                    <div className="self-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                        <ChevronRight size={20} className="text-[#8c25f4]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>

                {/* AI & Quick Actions Sidebar */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Neural Matches Widget */}
                    <motion.section 
                        variants={itemVariants} 
                        className="glass-panel p-8 rounded-[2rem] border-[#13ecec]/20 relative overflow-hidden group/matches"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transform group-hover:rotate-12 transition-transform duration-700">
                            <Brain size={120} className="text-[#13ecec]" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-[#13ecec]" size={20} />
                                <Typography variant="h3">Neural Matches</Typography>
                            </div>
                            
                            <div className="space-y-4">
                                {[
                                    { role: 'Staff Neural Engineer', company: 'X-Lab', match: '98%', type: 'Direct Link' },
                                    { role: 'System Architect', company: 'Vector', match: '95%', type: 'Priority' },
                                    { role: 'Interface Specialist', company: 'Nexus', match: '92%', type: 'Matching' },
                                ].map((job, i) => (
                                    <div key={i} className="glass-panel p-5 rounded-[1.5rem] border-white/5 hover:border-[#13ecec]/40 transition-all group/job cursor-pointer">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#13ecec]/10 text-[#13ecec] flex items-center justify-center font-black text-sm border border-[#13ecec]/20">
                                                    {job.company[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.2em] italic mb-1">{job.company}</p>
                                                    <p className="text-white font-black italic tracking-tight truncate">{job.role}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded italic">
                                                {job.match}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="w-full text-[10px] italic border-white/5 group-hover/job:border-[#13ecec]/30">
                                            Sync Trajectory_
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button variant="secondary" className="w-full group/btn shadow-[0_0_30px_rgba(19,236,236,0.2)]">
                                <span className="flex items-center justify-center gap-2">
                                    Access Global Mesh
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </div>
                    </motion.section>

                    {/* Quick Access Nodes */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Artifacts', icon: Award, color: 'text-amber-400' },
                            { label: 'Source', icon: Code, color: 'text-[#8c25f4]' },
                            { label: 'Protocol', icon: Target, color: 'text-emerald-400' },
                            { label: 'Nodes', icon: Activity, color: 'text-[#13ecec]' },
                        ].map((node) => (
                            <motion.button 
                                key={node.label}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-white/20 transition-all group flex flex-col items-center gap-4"
                            >
                                <div className={cn("p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors", node.color)}>
                                    <node.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-white transition-colors">{node.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Internal icons needed
const GitMerge = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 9v12" /><path d="M18 9v3a3 3 0 0 1-3 3H6" />
    </svg>
);

const Award = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
);
