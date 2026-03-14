import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, Medal, ChevronUp, ChevronDown, Minus, 
    Flame, Zap, Globe, Crown,
    Sparkles, Rocket, Brain
} from 'lucide-react';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

const MOCK_LEADERBOARD = [
    { id: 1, name: 'Alex Chen', role: 'System Architect', points: 15420, streak: 42, up: true, avatar: 'AC', color: 'from-[#8c25f4] to-[#13ecec]' },
    { id: 2, name: 'Priya Sharma', role: 'Neural Engineer', points: 14890, streak: 12, up: true, avatar: 'PS', color: 'from-[#13ecec] to-[#0ea5e9]' },
    { id: 3, name: 'David Kim', role: 'Interface Designer', points: 14200, streak: 3, up: false, avatar: 'DK', color: 'from-amber-600 to-orange-700' },
    { id: 4, name: 'Sarah Jones', role: 'Full Stack Node', points: 13500, streak: 8, up: null, avatar: 'SJ', color: 'from-[#8c25f4] to-pink-600' },
    { id: 5, name: 'Mohammed Ali', role: 'DevOps Catalyst', points: 12900, streak: 21, up: true, avatar: 'MA', color: 'from-emerald-500 to-teal-700' },
    { id: 6, name: 'Elena Rossi', role: 'Security Oracle', points: 12100, streak: 15, up: false, avatar: 'ER', color: 'from-blue-600 to-indigo-800' },
    { id: 7, name: 'Liam Wilson', role: 'Cloud Mesh Architect', points: 11800, streak: 9, up: true, avatar: 'LW', color: 'from-cyan-400 to-blue-600' },
    { id: 142, name: 'You', role: 'System Architect', points: 8450, streak: 7, up: true, avatar: 'U', isUser: true, color: 'from-[#8c25f4] to-[#0ea5e9]' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const LeaderboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('global');

    const getTrendIcon = (up: boolean | null) => {
        if (up === true) return <div className="flex items-center gap-1"><ChevronUp size={16} className="text-[#13ecec]" /><span className="text-[10px] font-black text-[#13ecec]">+2</span></div>;
        if (up === false) return <div className="flex items-center gap-1"><ChevronDown size={16} className="text-rose-500" /><span className="text-[10px] font-black text-rose-500">-1</span></div>;
        return <Minus size={16} className="text-slate-800" />;
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 px-4 sm:px-0"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Matrix Ascent Header */}
            <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-2xl bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#8c25f4]/15 blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-3xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/30 shadow-2xl shadow-[#8c25f4]/10">
                                <Trophy size={36} className="animate-pulse" />
                            </div>
                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-3xl shadow-lg">
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.4em] italic leading-none">Hierarchy Sync: Active</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white text-7xl tracking-tighter italic m-0 lg:leading-[0.9]">
                                Matrix Ascent_
                            </Typography>
                            <p className="text-slate-400 text-xl font-medium italic max-w-2xl leading-relaxed opacity-90 mx-auto md:mx-0">
                                Tracking high-concurrency talent nodes across the global mesh. Ascend the hierarchy through cognitive resolution.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 p-3 bg-black/60 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
                        {['global', 'mesh', 'nodes'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-10 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] italic transition-all duration-500",
                                    activeTab === tab 
                                        ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.2)] scale-105" 
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tab}_
                            </button>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Immersive Podium Hierarchy */}
            <motion.div variants={itemVariants} className="hidden md:flex justify-center items-end gap-12 h-[550px] relative pb-10 mt-10">
                {/* 2nd Place Node */}
                <motion.div 
                    whileHover={{ y: -15, scale: 1.02 }}
                    className="flex flex-col items-center w-64 group"
                >
                    <div className="relative mb-8">
                        <div className="size-32 rounded-[2rem] bg-slate-800 p-[3px] shadow-2xl group-hover:rotate-6 transition-transform border border-white/10">
                            <div className="w-full h-full rounded-[1.8rem] bg-[#050510] flex items-center justify-center text-3xl font-black text-slate-400 italic">AC</div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 size-12 bg-slate-400 rounded-2xl flex items-center justify-center text-slate-950 font-black italic shadow-xl border-4 border-[#050510]">2</div>
                    </div>
                    <Typography variant="h2" className="text-center italic mb-2 text-white text-3xl tracking-tighter group-hover:text-[#13ecec] transition-colors">{MOCK_LEADERBOARD[1].name}_</Typography>
                    <div className="flex items-center gap-2 mb-8">
                        <Zap size={14} className="text-[#8c25f4]" />
                        <Typography variant="label" className="text-[#8c25f4] italic font-black m-0 leading-none">{MOCK_LEADERBOARD[1].points.toLocaleString()} SIGS_</Typography>
                    </div>
                    <div className="w-full h-56 glass-panel bg-white/05 border border-white/05 rounded-t-[4rem] flex flex-col items-center pt-12 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/05 to-transparent pointer-events-none" />
                        <Medal size={60} className="text-slate-400 opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="h-px w-2/3 bg-white/05" />
                        <div className="flex gap-1.5 opacity-40">
                            {[1, 2, 3].map(i => <div key={i} className="size-1.5 rounded-full bg-slate-400" />)}
                        </div>
                    </div>
                </motion.div>

                {/* 1st Place (The Apex) */}
                <motion.div 
                    whileHover={{ y: -20, scale: 1.05 }}
                    className="flex flex-col items-center w-80 group z-10"
                >
                    <div className="relative mb-12">
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-[#13ecec] animate-bounce pointer-events-none">
                            <Crown size={64} className="drop-shadow-[0_0_30px_#13ecec]" />
                        </div>
                        <div className="size-44 rounded-[3rem] bg-gradient-to-br from-[#13ecec] to-[#8c25f4] p-[4px] shadow-[0_0_80px_rgba(19,236,236,0.25)] group-hover:scale-105 transition-transform duration-700">
                            <div className="w-full h-full rounded-[2.8rem] bg-[#050510] flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#13ecec]/20 to-[#8c25f4]/20 animate-pulse" />
                                <span className="text-5xl font-black text-white italic z-10 drop-shadow-2xl">AC</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 size-16 bg-[#13ecec] rounded-[1.5rem] flex items-center justify-center text-slate-950 font-black italic shadow-[0_0_40px_rgba(19,236,236,0.4)] border-[6px] border-[#050510] text-2xl">1</div>
                    </div>
                    <Typography variant="h2" className="text-center italic mb-3 text-white text-5xl tracking-tighter m-0 group-hover:text-[#13ecec] transition-colors leading-none">{MOCK_LEADERBOARD[0].name}_</Typography>
                    <div className="flex items-center gap-3 mb-12">
                        <Sparkles size={20} className="text-[#13ecec] animate-pulse" />
                        <Typography variant="h3" className="text-[#13ecec] italic mb-0 text-3xl tracking-tighter leading-none">{MOCK_LEADERBOARD[0].points.toLocaleString()} SIGS_</Typography>
                    </div>
                    <div className="w-full h-80 glass-panel bg-black/60 border border-[#13ecec]/30 rounded-t-[5rem] flex flex-col items-center pt-16 relative overflow-hidden shadow-[0_0_50px_rgba(19,236,236,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13ecec]/20 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <Rocket size={80} className="text-[#13ecec] opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:translate-y-[-20px]" />
                        <div className="mt-12 space-y-3 flex flex-col items-center opacity-40">
                             <div className="h-1 w-32 bg-[#13ecec] rounded-full shadow-[0_0_10px_#13ecec]" />
                             <div className="h-1 w-20 bg-[#13ecec]/60 rounded-full" />
                        </div>
                    </div>
                </motion.div>

                {/* 3rd Place Node */}
                <motion.div 
                    whileHover={{ y: -15, scale: 1.02 }}
                    className="flex flex-col items-center w-64 group"
                >
                    <div className="relative mb-8">
                        <div className="size-32 rounded-[2rem] bg-amber-900/60 p-[3px] shadow-2xl group-hover:-rotate-6 transition-transform border border-amber-900/30">
                            <div className="w-full h-full rounded-[1.8rem] bg-[#050510] flex items-center justify-center text-3xl font-black text-amber-700 italic">DK</div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 size-12 bg-amber-700 rounded-2xl flex items-center justify-center text-black font-black italic shadow-xl border-4 border-[#050510]">3</div>
                    </div>
                    <Typography variant="h2" className="text-center italic mb-2 text-white text-3xl tracking-tighter group-hover:text-[#13ecec] transition-colors">{MOCK_LEADERBOARD[2].name}_</Typography>
                    <div className="flex items-center gap-2 mb-8">
                        <Zap size={14} className="text-[#8c25f4]" />
                        <Typography variant="label" className="text-[#8c25f4] italic font-black m-0 leading-none">{MOCK_LEADERBOARD[2].points.toLocaleString()} SIGS_</Typography>
                    </div>
                    <div className="w-full h-44 glass-panel bg-amber-700/05 border border-amber-700/10 rounded-t-[4rem] flex flex-col items-center pt-10 space-y-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-700/05 to-transparent pointer-events-none" />
                        <Medal size={48} className="text-amber-700 opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="h-px w-2/3 bg-white/05" />
                        <div className="flex gap-1.5 opacity-40">
                            {[1, 2, 3].map(i => <div key={i} className="size-1.5 rounded-full bg-amber-700" />)}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Neural Ranking Matrix */}
            <motion.section variants={itemVariants} className="glass-panel border-white/5 overflow-hidden rounded-[3.5rem] bg-black/40 shadow-2xl relative">
                <div className="grid grid-cols-12 gap-8 px-16 py-10 border-b border-white/10 bg-black/60 text-[11px] font-black uppercase tracking-[0.4em] text-slate-800 italic relative z-10">
                    <div className="col-span-1 text-center">Protocol</div>
                    <div className="col-span-6 ml-4">Identity Node Signature_</div>
                    <div className="col-span-2 text-right">Sync_Burst</div>
                    <div className="col-span-3 text-right">Signal Yield_</div>
                </div>

                <div className="divide-y divide-white/05 relative z-10">
                    {MOCK_LEADERBOARD.slice(3).map((user, index) => (
                        <motion.div 
                            key={user.id} 
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            className={cn(
                                "grid grid-cols-12 gap-8 px-16 py-10 items-center transition-all group",
                                user.isUser ? "bg-[#13ecec]/05 border-l-[6px] border-[#13ecec] shadow-[inset_10px_0_30px_rgba(19,236,236,0.05)]" : "border-l-[6px] border-transparent"
                            )}
                        >
                            <div className="col-span-1 flex justify-center">
                                <span className="text-2xl font-black italic text-slate-900 group-hover:text-white transition-all transform group-hover:scale-125 duration-500">#{index + 4}</span>
                            </div>

                            <div className="col-span-6 flex items-center gap-8 ml-4">
                                <div className="relative group/avatar">
                                    <div className={cn("size-20 rounded-[1.5rem] bg-gradient-to-br p-[2px] shadow-2xl transition-all duration-700 group-hover/avatar:rotate-12", user.color)}>
                                        <div className="w-full h-full rounded-[1.4rem] bg-[#050510] flex items-center justify-center overflow-hidden">
                                             <span className="text-xl font-black text-white italic drop-shadow-lg">{user.avatar}</span>
                                        </div>
                                    </div>
                                    <div className="absolute -top-1 -right-1 size-5 bg-[#13ecec] rounded-full border-[3px] border-[#050510] opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-colors flex items-center gap-4 m-0">
                                        {user.name}_ {user.isUser && (
                                            <span className="px-3 py-1 bg-[#13ecec] text-black text-[9px] font-black rounded-xl uppercase italic shadow-[0_0_15px_rgba(19,236,236,0.5)]">Core Node</span>
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div className="size-1.5 bg-[#8c25f4]/60 rounded-full" />
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic m-0">{user.role}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 flex justify-end items-center gap-4">
                                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 group-hover:border-orange-500/50 transition-all">
                                    <Flame size={18} className="text-orange-500 animate-pulse" />
                                </div>
                                <span className="text-sm font-black text-orange-500 italic uppercase tracking-widest">{user.streak}D Sync_</span>
                            </div>

                            <div className="col-span-3 flex items-center justify-end gap-10 text-right">
                                <div className="space-y-1">
                                    <span className="text-4xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-all leading-none block">
                                        {user.points.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] group-hover:text-slate-600 transition-colors">SIGS_RESOLVED</span>
                                </div>
                                <div className="w-12 flex justify-center scale-125">
                                    {getTrendIcon(user.up)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Perspective Anchor Foot */}
                <div className="p-16 bg-black/60 border-t border-white/05 flex flex-col items-center space-y-8 relative overflow-hidden group/foot">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/05 to-transparent pointer-events-none" />
                    <Brain size={40} className="text-[#8c25f4] opacity-20 group-hover/foot:scale-110 group-hover/foot:opacity-40 transition-all duration-700" />
                    <div className="space-y-2 text-center">
                        <Typography variant="h3" className="text-white italic text-2xl tracking-tighter uppercase m-0 leading-none">Expand Universal Resolution_</Typography>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Global synchronized mesh data tier 1.0.4</p>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Support Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {[
                    { title: 'Neural Velocity', desc: 'Accelerate signal yield through high-frequency challenge resolution.', icon: Zap, theme: '#13ecec' },
                    { title: 'Mesh Expansion', desc: 'Expand your neural mesh to unlock higher connectivity tiers.', icon: Globe, theme: '#8c25f4' },
                    { title: 'Core Logic', desc: 'Maintain peak integrity through consistent daily synchronization.', icon: Brain, theme: '#10b981' },
                ].map((mod, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-6 bg-black/40 group hover:border-white/20 transition-all duration-500 shadow-2xl"
                    >
                        <div className="size-16 rounded-[1.5rem] bg-white/05 border border-white/10 flex items-center justify-center group-hover:rotate-12 transition-all duration-700">
                            <mod.icon size={28} style={{ color: mod.theme }} />
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase m-0 group-hover:text-[#13ecec] transition-colors">{mod.title}_</h4>
                             <p className="text-slate-400 italic font-medium text-lg leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{mod.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
