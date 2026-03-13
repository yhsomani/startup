import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Users, Briefcase, Calendar, Award, 
    Search, Plus, Activity, Filter, 
    TrendingUp, ChevronRight, Zap, Brain,
    MessageSquare, Star, Target, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface RecruiterStats {
    activeJobs: number;
    totalApplicants: number;
    interviewsScheduled: number;
    hired: number;
}


const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'New', color: 'text-[#13ecec]', bg: 'bg-[#13ecec]/10' },
    in_review: { label: 'In Review', color: 'text-slate-400', bg: 'bg-slate-400/10' },
    interview: { label: 'Interview', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    offer: { label: 'Offer Sent', color: 'text-[#8c25f4]', bg: 'bg-[#8c25f4]/10' },
    rejected: { label: 'Rejected', color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any }
    }
};

export const RecruiterDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<RecruiterStats>({
        activeJobs: 24,
        totalApplicants: 432,
        interviewsScheduled: 36,
        hired: 12
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const jobsRes = await api.get('/api/v1/jobs/active?limit=100').catch(() => null);
                if (jobsRes?.data) {
                    const jobs = jobsRes.data.jobs ?? [];
                    setStats({
                        activeJobs: jobs.length || 24,
                        totalApplicants: (jobs.length || 24) * 18,
                        interviewsScheduled: Math.ceil((jobs.length || 24) * 1.5),
                        hired: Math.ceil((jobs.length || 24) * 0.4),
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const name = user?.firstName || 'Marcus';
    const getInitials = (n: string) => n.split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 w-full pb-12"
        >
            {/* Enterprise Header Area */}
            <motion.section 
                variants={itemVariants}
                className="relative overflow-hidden p-8 md:p-12 glass-panel rounded-[2rem] border-white/10 group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/5 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#8c25f4]/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="px-3 py-1 bg-[#8c25f4]/10 rounded-full border border-[#8c25f4]/30 flex items-center gap-2">
                                <Activity size={12} className="text-[#8c25f4]" />
                                <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">Command Hub Active</span>
                            </div>
                            <div className="px-3 py-1 bg-[#13ecec]/10 rounded-full border border-[#13ecec]/30 flex items-center gap-2">
                                <TrendingUp size={12} className="text-[#13ecec]" />
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-widest italic">+15% Growth Velocity</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white">
                                HQ Dashboard_
                            </Typography>
                            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                                Directing the talent flow, {name}. Your neural recruitment pipe is processing 
                                <span className="text-[#8c25f4] font-black ml-2 bg-[#8c25f4]/10 px-2 py-0.5 rounded italic">432 Active Candidates</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search Global Mesh..."
                                className="w-full lg:w-72 pl-12 pr-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:border-[#8c25f4]/50 focus:ring-0 transition-all italic text-sm font-bold"
                            />
                        </div>
                        <Button 
                            variant="primary" 
                            size="lg"
                            onClick={() => navigate('/jobs/new')}
                            className="flex-1 lg:flex-none group/btn"
                        >
                            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
                            Launch Neural Job
                        </Button>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Metrics & Pipeline (8 cols) */}
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Active Matrix', value: stats.activeJobs, icon: Briefcase, color: '#13ecec' },
                            { label: 'Neural Apps', value: stats.totalApplicants, icon: Users, color: '#8c25f4' },
                            { label: 'Sync Status', value: stats.interviewsScheduled, icon: Calendar, color: '#10b981' },
                            { label: 'Acquisitions', value: stats.hired, icon: Award, color: '#f59e0b' },
                        ].map((m) => (
                            <motion.div 
                                key={m.label}
                                variants={itemVariants}
                                className="glass-panel p-6 rounded-3xl border-white/5 hover:border-[#13ecec]/20 transition-all group/card overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-white/5 text-slate-400 group-hover/card:text-white group-hover/card:bg-[#13ecec]/20 transition-all">
                                            <m.icon size={20} />
                                        </div>
                                        <div className="w-12 h-6 flex items-center justify-end">
                                            <svg className="h-4 w-full" viewBox="0 0 100 30">
                                                <path d="M0 25 Q 10 5, 20 20 T 40 10 T 60 25 T 80 5 T 100 15" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <Typography variant="label" className="text-slate-500 mb-1">{m.label}</Typography>
                                    <div className="text-3xl font-black text-white italic tracking-tighter">
                                        {loading ? '---' : m.value}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pipeline & Real-time Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pipeline Funnel */}
                        <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2rem] border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Filter className="text-[#13ecec]" size={20} />
                                    <Typography variant="h3">Talent Funnel</Typography>
                                </div>
                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black italic rounded">REAL-TIME</div>
                            </div>
                            
                            <div className="space-y-4">
                                {[
                                    { label: 'Applied', value: 156, width: '100%', color: 'from-[#13ecec]/20 to-transparent' },
                                    { label: 'Neural Mix', value: 84, width: '82%', color: 'from-[#8c25f4]/20 to-transparent' },
                                    { label: 'Sync Phase', value: 32, width: '64%', color: 'from-emerald-500/20 to-transparent' },
                                    { label: 'Acquisiton', value: 12, width: '40%', color: 'from-amber-500/20 to-transparent' },
                                ].map((stage) => (
                                    <div key={stage.label} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic text-slate-500">
                                            <span>{stage.label}</span>
                                            <span className="text-white">{stage.value}</span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: stage.width }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={cn("h-full bg-gradient-to-r rounded-full", stage.color)} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Recent Signal Feed */}
                        <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2rem] border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <Zap className="text-[#8c25f4]" size={20} />
                                <Typography variant="h3">Neural Signals</Typography>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { user: 'Sarah Chen', action: 'completed Neural Challenge', time: '2m ago', icon: Brain, color: 'text-[#13ecec]' },
                                    { user: 'Alex Rivera', action: 'accepted Sync Invitation', time: '15m ago', icon: Activity, color: 'text-[#8c25f4]' },
                                    { user: 'AI Matcher', action: 'detected 3 Top Tier matches', time: '1h ago', icon: Sparkles, color: 'text-amber-400' },
                                    { user: 'TalentSphere', action: 'processed 12 New Apps', time: '3h ago', icon: Zap, color: 'text-emerald-400' },
                                ].map((sig, i) => (
                                    <div key={i} className="flex gap-4 group/sig">
                                        <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 transition-transform group-hover/sig:scale-110", sig.color)}>
                                            <sig.icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-300 leading-tight">
                                                <span className="text-white font-black italic">{sig.user}</span> {sig.action}
                                            </p>
                                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic mt-1">{sig.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    </div>

                    {/* Applications Matrix */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[2rem] border-white/5 overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <Typography variant="h3">Recent Protocols</Typography>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/applications')} className="text-[10px] font-black italic uppercase tracking-widest">
                                Global Database
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#8c25f4]/5">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Candidate</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Neural Link</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[
                                        { name: 'Alex Rivera', role: 'Staff Designer', status: 'interview', time: '2h ago' },
                                        { name: 'Sarah Chen', role: 'Neural Engineer', status: 'pending', time: '5h ago' },
                                        { name: 'Marcus Johnson', role: 'System Architect', status: 'offer', time: '1d ago' },
                                        { name: 'Elena Gupta', role: 'Data Core', status: 'in_review', time: '2d ago' },
                                    ].map((app, i) => {
                                        const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
                                        return (
                                            <tr key={i} className="hover:bg-white/5 transition-all group cursor-pointer">
                                                <td className="px-8 py-5 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2px] shadow-lg shadow-[#8c25f4]/20 group-hover:scale-110 transition-transform">
                                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white">
                                                            {getInitials(app.name)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white italic group-hover:text-[#13ecec] transition-colors">{app.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest">{app.time}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-xs text-slate-400 font-bold italic">{app.role}</td>
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] italic border border-white/5",
                                                        status.bg, status.color
                                                    )}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                </div>

                {/* Sidebar Intelligence (4 cols) */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Top Talent Spotlight */}
                    <motion.section 
                        variants={itemVariants} 
                        className="glass-panel p-8 rounded-[2rem] border-[#8c25f4]/20 relative overflow-hidden group/talent"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transform group-hover:-rotate-12 transition-transform duration-700">
                            <Star size={120} className="text-[#8c25f4]" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-[#8c25f4]" size={20} />
                                <Typography variant="h3">Elite Matches</Typography>
                            </div>
                            
                            <div className="space-y-4">
                                {[
                                    { name: 'Elena Gupta', role: 'Staff UX Designer', match: 98, skills: ['Figma', 'Prototyping'] },
                                    { name: 'Marcus Johnson', role: 'Fullstack Lead', match: 94, skills: ['React', 'Node'] },
                                ].map((talent, i) => (
                                    <div key={i} className="glass-panel p-5 rounded-[1.5rem] border-white/5 hover:border-[#8c25f4]/40 transition-all group/item cursor-pointer">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#8c25f4]/10 text-[#8c25f4] flex items-center justify-center font-black text-sm border border-[#8c25f4]/20">
                                                {getInitials(talent.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-black italic uppercase tracking-tight truncate group-hover/item:text-[#13ecec] transition-colors">{talent.name}</h4>
                                                <p className="text-[10px] text-[#8c25f4] font-black uppercase tracking-[0.2em] italic">{talent.role}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 text-lg font-black italic leading-none">{talent.match}%</div>
                                                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Match</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {talent.skills.map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">{s}</span>
                                            ))}
                                        </div>
                                        <Button variant="ghost" size="sm" className="w-full text-[10px] italic border-white/5 group-hover/item:border-[#8c25f4]/30">
                                            Initiate Deep Sync_
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button variant="secondary" className="w-full group/btn shadow-[0_0_30px_rgba(140,37,244,0.1)]">
                                <span className="flex items-center justify-center gap-2">
                                    Explore Talent Mesh
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </div>
                    </motion.section>

                    {/* Productivity Module */}
                    <motion.section 
                        variants={itemVariants}
                        className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-[#13ecec]/10 flex items-center justify-center text-[#13ecec] border border-[#13ecec]/20">
                            <Brain size={24} />
                        </div>
                        <Typography variant="h3">AI Workflow Tip</Typography>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                            Utilize <span className="text-white font-black uppercase">Neural Scoring</span> to auto-rank 400+ applications in under 5 seconds.
                        </p>
                        <Button variant="ghost" size="sm" className="w-full text-[10px] font-black italic tracking-[0.2em] uppercase border-white/5 hover:border-[#13ecec]/30">
                            Upgrade Protocol →
                        </Button>
                    </motion.section>

                    {/* Command Console Nodes */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Neural Mix', icon: Brain, color: 'text-[#13ecec]' },
                            { label: 'Sync Log', icon: MessageSquare, color: 'text-[#8c25f4]' },
                            { label: 'Pipe Config', icon: Target, color: 'text-emerald-400' },
                            { label: 'Node Info', icon: Activity, color: 'text-slate-400' },
                        ].map((node) => (
                            <motion.button 
                                key={node.label}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-white/20 transition-all group flex flex-col items-center gap-4 text-center"
                            >
                                <div className={cn("p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors", node.color)}>
                                    <node.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-white transition-colors leading-tight">{node.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
