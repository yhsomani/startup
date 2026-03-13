import React from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, Flame, Star, Zap, Target, Code, 
    BookOpen, Users, Award, ShieldCheck, Orbit, Activity,
    Lock, Cpu, Brain
} from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

const MOCK_BADGES = [
    { id: 1, name: 'First Steps', icon: Star, color: 'text-[#13ecec] bg-[#13ecec]/15 border-[#13ecec]/30 shadow-[#13ecec]/10', description: 'Completed your first action', unlocked: true, date: 'Jan 15', rarity: 'Common' },
    { id: 2, name: '7-Day Streak', icon: Flame, color: 'text-orange-500 bg-orange-500/15 border-orange-500/30 shadow-orange-500/10', description: 'Logged in 7 days in a row', unlocked: true, date: 'Feb 3', rarity: 'Uncommon' },
    { id: 3, name: 'Code Warrior', icon: Code, color: 'text-[#8c25f4] bg-[#8c25f4]/15 border-[#8c25f4]/30 shadow-[#8c25f4]/10', description: 'Solved 50 challenges', unlocked: true, date: 'Feb 20', rarity: 'Rare' },
    { id: 4, name: 'Knowledge Seeker', icon: BookOpen, color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30 shadow-emerald-400/10', description: 'Completed 5 courses', unlocked: true, date: 'Mar 1', rarity: 'Uncommon' },
    { id: 5, name: 'Networker', icon: Users, color: 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30 shadow-cyan-500/10', description: 'Made 25 connections', unlocked: true, date: 'Mar 4', rarity: 'Common' },
    { id: 6, name: 'Top 100', icon: Trophy, color: 'text-amber-400 bg-amber-400/15 border-amber-400/30 shadow-amber-400/10', description: 'Reached Top 100 on leaderboard', unlocked: false, rarity: 'Legendary' },
    { id: 7, name: 'Speed Coder', icon: Zap, color: 'text-[#13ecec] bg-[#13ecec]/15 border-[#13ecec]/30 shadow-[#13ecec]/10', description: 'Solve a challenge under 5 minutes', unlocked: false, rarity: 'Rare' },
    { id: 8, name: 'Perfectionist', icon: Target, color: 'text-rose-400 bg-rose-400/15 border-rose-400/30 shadow-rose-400/10', description: 'Score 100% on 10 challenges', unlocked: false, rarity: 'Legendary' },
];

const rarityColors: Record<string, string> = {
    Common: 'text-slate-500',
    Uncommon: 'text-emerald-500',
    Rare: 'text-[#13ecec] drop-shadow-[0_0_8px_rgba(19,236,236,0.3)]',
    Legendary: 'text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]',
};

const LEVELS = [
    { level: 1, name: 'Apprentice', minXp: 0, maxXp: 500 },
    { level: 2, name: 'Developer', minXp: 500, maxXp: 1500 },
    { level: 3, name: 'Engineer', minXp: 1500, maxXp: 3500 },
    { level: 4, name: 'Senior', minXp: 3500, maxXp: 7000 },
    { level: 5, name: 'Principal', minXp: 7000, maxXp: 15000 },
];

const USER_XP = 2340;
const USER_STREAK = 7;
const currentLevel = LEVELS.find(l => USER_XP >= l.minXp && USER_XP < l.maxXp) || LEVELS[2];
const xpProgress = Math.round(((USER_XP - currentLevel.minXp) / (currentLevel.maxXp - currentLevel.minXp)) * 100);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const AchievementsPage: React.FC = () => {
    const unlockedCount = MOCK_BADGES.filter(b => b.unlocked).length;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 px-4 sm:px-0"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[5%] right-[-5%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[15%] left-[-5%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full animate-pulse delay-500" />
            </div>

            {/* Achievement Matrix Header */}
            <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-2xl bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#8c25f4]/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-shrink-0 relative group/avatar">
                        <div className="size-40 rounded-[3rem] bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[3px] shadow-[0_0_60px_rgba(140,37,244,0.4)] group-hover/avatar:rotate-12 transition-all duration-700">
                            <div className="w-full h-full rounded-[2.8rem] bg-[#050510] flex items-center justify-center">
                                <Trophy size={60} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                            </div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 size-16 rounded-2xl bg-[#13ecec] flex items-center justify-center text-slate-950 font-black italic shadow-[0_0_30px_rgba(19,236,236,0.5)] border-4 border-[#050510] text-xl">
                            {currentLevel.level}
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Typography variant="h1" className="text-white text-7xl tracking-tighter italic m-0 lg:leading-[0.9]">Achievement Matrix_</Typography>
                                    <div className="px-5 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                                        <Activity size={16} className="text-[#13ecec] animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">Global Sync: 99.9%</span>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xl font-medium italic max-w-2xl leading-relaxed">
                                    Decoding cognitive expansion milestones. Your neural evolution is being tracked across the global development mesh.
                                </p>
                            </div>
                            <div className="px-8 py-4 bg-[#13ecec]/15 border border-[#13ecec]/30 rounded-2xl inline-flex items-center gap-4 shadow-[0_20px_40px_rgba(19,236,236,0.1)]">
                                <Flame size={24} className="text-[#13ecec] animate-pulse" />
                                <span className="text-white text-sm font-black italic uppercase tracking-[0.2em]">{USER_STREAK} Day Sync Streak</span>
                            </div>
                        </div>

                        {/* XP Progress Architecture */}
                        <div className="space-y-5">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] italic text-slate-600">
                                <span className="text-[#8c25f4]">{USER_XP.toLocaleString()} XP RESOLVED</span>
                                <span>{currentLevel.maxXp.toLocaleString()} XP FOR NEXT SEQUENCE</span>
                            </div>
                            <div className="h-6 bg-black/40 rounded-full overflow-hidden p-[3px] border border-white/5 relative shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#8c25f4] to-[#13ecec] rounded-full shadow-[0_0_30px_rgba(19,236,236,0.3)] relative" 
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Tactical Level Track */}
                        <div className="flex items-center gap-6">
                            {LEVELS.map((l, i) => (
                                <React.Fragment key={l.level}>
                                    <div className={cn(
                                        'size-12 rounded-2xl flex items-center justify-center text-[12px] font-black italic tracking-tighter transition-all duration-700 border-2',
                                        l.level <= currentLevel.level
                                            ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-110'
                                            : 'bg-black/40 text-slate-700 border-white/05'
                                    )}>
                                        L{l.level}
                                    </div>
                                    {i < LEVELS.length - 1 && (
                                        <div className={cn('flex-1 h-[2px] rounded-full', l.level < currentLevel.level ? 'bg-[#13ecec] shadow-[0_0_10px_#13ecec]' : 'bg-white/05')} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Signal Yield', value: USER_XP.toLocaleString(), icon: Zap, color: 'text-[#8c25f4]' },
                    { label: 'Neural Nodes', value: `${unlockedCount}/${MOCK_BADGES.length}`, icon: Award, color: 'text-[#13ecec]' },
                    { label: 'Burn Velocity', value: `${USER_STREAK} Days`, icon: Flame, color: 'text-orange-500' },
                    { label: 'Current Tier', value: currentLevel.name.toUpperCase(), icon: Orbit, color: 'text-emerald-400' },
                ].map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-[#13ecec]/30 transition-all group bg-black/40 shadow-2xl">
                        <div className="p-4 rounded-2xl bg-white/05 border border-white/05 mb-8 w-fit group-hover:bg-white/10 transition-all">
                            <stat.icon size={28} className={cn('group-hover:scale-110 transition-transform', stat.color)} />
                        </div>
                        <Typography variant="h2" className="text-white mb-2 italic tracking-tighter text-4xl leading-none">{stat.value}_</Typography>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic leading-none">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Synchronized Node Registry */}
            <motion.section variants={itemVariants} className="space-y-12">
                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                    <div className="p-4 rounded-2xl bg-[#13ecec]/15 text-[#13ecec] border border-[#13ecec]/30 shadow-2xl">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-1">
                        <Typography variant="h2" className="text-white italic mb-0 text-4xl tracking-tighter">Synchronized Nodes_</Typography>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Validated operational achievements</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MOCK_BADGES.filter(b => b.unlocked).map(badge => (
                        <motion.div 
                            key={badge.id} 
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group glass-panel border-white/10 p-10 rounded-[3rem] text-center hover:border-[#13ecec]/40 transition-all cursor-default relative overflow-hidden bg-black/40 shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13ecec]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className={cn('mx-auto mb-8 size-24 rounded-[2.2rem] flex items-center justify-center p-[2px] transition-all duration-700 group-hover:rotate-[15deg] shadow-2xl', badge.color)}>
                                <div className="w-full h-full rounded-[2.1rem] bg-[#050510] flex items-center justify-center">
                                    <badge.icon size={44} />
                                </div>
                            </div>
                            <Typography variant="h3" className="text-white mb-2 italic tracking-tighter text-2xl uppercase leading-none">{badge.name}_</Typography>
                            <p className={cn('text-[11px] font-black uppercase tracking-[0.3em] italic mt-4', rarityColors[badge.rarity])}>{badge.rarity}</p>
                            
                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-3">
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] italic">{badge.date} SYNC PROTOCOL</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => <div key={i} className="size-1 rounded-full bg-[#13ecec]/40" />)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Dormant Signal Nodes */}
            <motion.section variants={itemVariants} className="space-y-12">
                <div className="flex items-center gap-6 border-b border-white/5 pb-8 opacity-40">
                    <div className="p-4 rounded-2xl bg-white/05 text-slate-500 border border-white/10">
                        <Lock size={32} />
                    </div>
                    <div className="space-y-1">
                        <Typography variant="h2" className="text-slate-500 italic mb-0 text-4xl tracking-tighter">Dormant Signal Nodes_</Typography>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">Pending cognitive resolution</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MOCK_BADGES.filter(b => !b.unlocked).map(badge => (
                        <div key={badge.id} className="group relative glass-panel border-dashed border-white/10 p-10 rounded-[3rem] text-center overflow-hidden cursor-pointer bg-black/20 hover:bg-black/40 transition-all duration-700">
                            <div className="mx-auto mb-8 size-24 rounded-[2.2rem] bg-white/05 border border-white/05 flex items-center justify-center filter grayscale opacity-20 group-hover:opacity-40 transition-all group-hover:scale-95">
                                <Lock size={44} className="text-slate-700" />
                            </div>
                            <Typography variant="h3" className="text-slate-700 italic mb-2 tracking-tighter text-2xl uppercase leading-none">{badge.name}_</Typography>
                            <p className={cn('text-[11px] font-black uppercase tracking-[0.3em] italic mt-4 opacity-10 group-hover:opacity-30', rarityColors[badge.rarity])}>{badge.rarity}</p>
                            
                            <div className="mt-8 pt-8 border-t border-white/05 flex flex-col items-center gap-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="h-1 w-20 bg-slate-800 rounded-full" />
                                <div className="h-1 w-12 bg-slate-900 rounded-full" />
                            </div>

                            {/* Neural Encryption Overlay */}
                            <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center p-12 border border-[#8c25f4]/30 rounded-[3rem] backdrop-blur-3xl">
                                <div className="p-4 rounded-3xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/30 mb-8 animate-pulse shadow-2xl">
                                    <Cpu size={38} />
                                </div>
                                <Typography variant="h4" className="text-white italic tracking-tighter mb-4 uppercase text-center">Protocol Specs_</Typography>
                                <p className="text-sm text-slate-400 font-bold italic uppercase tracking-widest text-center leading-loose opacity-80">
                                    {badge.description}
                                </p>
                                <div className="mt-8 px-6 py-2 bg-white/05 rounded-full border border-white/10">
                                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Encrypted_Signal_Offline</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Achievement Footer Section */}
            <motion.section variants={itemVariants} className="pt-20 border-t border-white/5 flex flex-col items-center text-center space-y-8">
                <Brain size={60} className="text-[#8c25f4] opacity-20 animate-pulse" />
                <div className="space-y-4 max-w-2xl">
                    <Typography variant="h2" className="text-white italic text-4xl tracking-tighter mb-0 uppercase leading-none">Neural Potential Unbound_</Typography>
                    <p className="text-slate-500 text-lg font-medium italic leading-relaxed opacity-70">
                        Continue your orbital trajectory. Every resolved challenge and completed knowledge node expands the global development matrix.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="h-20 px-16 rounded-[1.8rem] text-[12px] font-black italic tracking-[0.3em] uppercase bg-gradient-to-r from-[#8c25f4] to-[#13ecec] shadow-[0_20px_50px_rgba(140,37,244,0.3)] hover:scale-105 transition-all"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    RETURN TO APEX_
                </Button>
            </motion.section>
        </motion.div>
    );
};
