import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Share2, MapPin,
    Brain, Briefcase, GraduationCap, Code,
    Globe, Github, Mail, Camera,
    ExternalLink, ShieldCheck, Zap, Activity,
    Target, Sparkles, Rocket, Award, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface ProfileData {
    firstName: string;
    lastName: string;
    headline: string;
    location: string;
    email: string;
    portfolioUrl: string;
    githubUrl: string;
    about: string;
    skills: string[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const [profileData, setProfileData] = useState<ProfileData>({
        firstName: '',
        lastName: '',
        headline: '',
        location: '',
        email: user?.email || '',
        portfolioUrl: '',
        githubUrl: '',
        about: '',
        skills: [] as string[]
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                setIsLoading(true);
                const response = await api.get('/api/v1/users/profile').catch(() => null);
                if (response?.data?.profile) {
                    const p = response.data.profile;
                    setProfileData({
                        firstName: p.name?.split(' ')[0] || '',
                        lastName: p.name?.split(' ').slice(1).join(' ') || '',
                        headline: p.role || '',
                        location: p.location || '',
                        email: user.email || '',
                        portfolioUrl: p.portfolioUrl || '',
                        githubUrl: p.githubUrl || '',
                        about: p.bio || '',
                        skills: p.skills || []
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-8 bg-[#050510] fixed inset-0 z-50">
                <div className="relative size-20">
                    <div className="absolute inset-0 border-4 border-[#8c25f4]/10 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-4 border-t-[#8c25f4] border-transparent rounded-full animate-spin" />
                </div>
                <Typography variant="label" className="text-slate-600 italic uppercase tracking-[0.4em] text-[10px] font-black">Synchronizing Neural Profile_</Typography>
            </div>
        );
    }

    const initials = `${profileData.firstName?.[0] || ''}${profileData.lastName?.[0] || ''}`.toUpperCase() || 'U';

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto pb-40 space-y-16 px-4 sm:px-0 relative"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[var(--color-background)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--color-primary-glow)_0%,transparent_40%),radial-gradient(circle_at_80%_70%,var(--color-secondary-glow)_0%,transparent_40%)]" />
                <div className="absolute top-[10%] left-[20%] w-0.5 h-0.5 bg-[var(--color-secondary)] rounded-full opacity-40 animate-pulse" />
                <div className="absolute top-[40%] left-[80%] w-0.5 h-0.5 bg-[var(--color-secondary)] rounded-full opacity-40 animate-pulse delay-75" />
                <div className="absolute top-[70%] left-[15%] w-0.5 h-0.5 bg-[var(--color-secondary)] rounded-full opacity-40 animate-pulse delay-150" />
                <div className="absolute top-[85%] left-[60%] w-0.5 h-0.5 bg-[var(--color-secondary)] rounded-full opacity-40 animate-pulse delay-200" />
                <div className="absolute top-[30%] left-[45%] w-0.5 h-0.5 bg-[var(--color-secondary)] rounded-full opacity-40 animate-pulse delay-300" />
            </div>

            {/* Neural Identity Module */}
            <motion.section variants={itemVariants} className="relative">
                <div className="glass-panel rounded-[3.5rem] overflow-hidden border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-black/40">
                    <div className="h-80 w-full relative overflow-hidden">
                        {/* Immersive Cover Stream */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/30 via-transparent to-[#13ecec]/20" />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8c25f4 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#13ecec]/10 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none animate-pulse" />
                        
                        <div className="absolute top-8 left-10 flex gap-4 z-20">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-4 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 text-white hover:text-[#13ecec] hover:border-[#13ecec]/30 transition-all hover:scale-110 active:scale-95 shadow-2xl"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>
                        
                        <div className="absolute top-8 right-10 flex gap-4 z-20">
                            <button className="p-4 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 text-white hover:text-[#8c25f4] hover:border-[#8c25f4]/30 transition-all hover:scale-110 shadow-2xl">
                                <Share2 size={20} />
                            </button>
                        </div>

                        {/* Visual Purity Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    </div>
                    
                    <div className="px-12 pb-16 -mt-24 relative z-30">
                        <div className="flex flex-col lg:flex-row items-end gap-12">
                            {/* Neural Avatar with Core Glow */}
                            <div className="relative group/avatar">
                                <div className="size-48 rounded-[3rem] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-[3px] shadow-[0_0_60px_var(--color-primary-glow)] rotate-3 group-hover/avatar:rotate-0 transition-all duration-700 ease-[0.4,0,0.2,1]">
                                    <div className="w-full h-full rounded-[2.8rem] bg-[var(--color-background)] flex items-center justify-center overflow-hidden relative">
                                        <Typography variant="h1" className="text-6xl font-black text-white italic tracking-tighter m-0">{initials}</Typography>
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Camera size={38} className="text-[var(--color-secondary)] animate-pulse" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">Update Core_</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 -right-3 size-14 rounded-2xl bg-[var(--color-secondary)] flex items-center justify-center text-black shadow-[0_0_30px_var(--color-secondary-glow)] border-4 border-[var(--color-background)] transition-transform group-hover/avatar:scale-110">
                                    <ShieldCheck size={28} />
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-6 pb-2">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="px-5 py-2 bg-[var(--color-secondary)]/15 rounded-xl border border-[var(--color-secondary)]/30 flex items-center gap-3 shadow-[0_0_20px_rgba(19,236,236,0.1)]">
                                        <Zap size={16} className="text-[var(--color-secondary)] animate-pulse" />
                                        <span className="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-[0.3em] italic">Neural Link: Verified</span>
                                    </div>
                                    <div className="px-5 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{profileData.location || 'Global Mesh Node'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Typography variant="h1" className="text-white text-7xl tracking-tighter italic m-0 lg:leading-[0.8]">
                                        {profileData.firstName} {profileData.lastName}_
                                    </Typography>
                                    <Typography variant="h3" className="text-[#8c25f4] italic tracking-[0.3em] text-2xl m-0 leading-none">
                                        {profileData.headline || 'System Architect'}
                                    </Typography>
                                </div>
                            </div>

                            <div className="flex gap-6 w-full lg:w-auto pb-4">
                                <Button 
                                    size="lg" 
                                    className="h-20 flex-1 lg:flex-none px-16 rounded-[1.5rem] text-[12px] font-black italic tracking-[0.2em] shadow-[0_20px_40px_rgba(140,37,244,0.3)] bg-[#8c25f4] hover:bg-white hover:text-black transition-all group"
                                    onClick={() => navigate('/settings')}
                                >
                                    <span className="flex items-center gap-3">REFINE IDENTITY <Sparkles size={18} className="group-hover:rotate-45 transition-transform" /></span>
                                </Button>
                                <Button variant="secondary" size="lg" className="h-20 size-20 rounded-[1.5rem] p-0 flex items-center justify-center border-white/10 bg-white/5 hover:border-[#13ecec]/40 transition-all">
                                    <Activity size={24} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Tactical Nodes (4 cols) */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Neural Summary */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3rem] border-white/5 relative overflow-hidden group bg-black/40 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity rotate-12">
                            <Brain size={120} className="text-[#8c25f4]" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                <div className="p-3 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg">
                                    <Target size={24} />
                                </div>
                                <Typography variant="h2" className="m-0 italic tracking-tighter text-3xl">Neural Core_</Typography>
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed italic text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                {profileData.about || 'Matrix overview pending synchronization. Integrate your core narrative to broadcast advanced system capabilities.'}
                            </p>
                        </div>
                    </motion.section>

                    {/* Connectivity Mesh */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3rem] border-white/10 space-y-10 bg-black/60 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30 shadow-lg">
                                <Globe size={24} />
                            </div>
                            <Typography variant="h2" className="m-0 italic tracking-tighter text-3xl">Neural Links_</Typography>
                        </div>
                        <div className="space-y-4">
                            {[
                                { icon: Mail, label: 'Standard Uplink', value: profileData.email, color: 'var(--color-secondary)', bg: 'rgba(19, 236, 236, 0.1)' },
                                { icon: Github, label: 'Source Stream', value: profileData.githubUrl || 'github.com/identity', color: 'var(--color-primary)', bg: 'rgba(140, 37, 244, 0.1)' },
                                { icon: ExternalLink, label: 'Matrix Portal', value: profileData.portfolioUrl || 'identity.io', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' },
                            ].map((link, i) => (
                                <motion.a 
                                    key={i} 
                                    href="#" 
                                    whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/02 border border-white/05 hover:border-white/20 transition-all group/link"
                                >
                                    <div className="size-14 rounded-2xl flex items-center justify-center transition-all bg-black/40 border border-white/05 group-hover/link:shadow-2xl" style={{ color: link.color }}>
                                        <link.icon size={24} className="group-hover/link:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-1">{link.label}</p>
                                        <p className="text-sm font-black text-white truncate italic tracking-tight">{link.value}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </motion.section>

                    {/* Performance Metrics */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-[#8c25f4]/15 to-transparent shadow-2xl">
                        <div className="flex items-center gap-4 mb-10">
                            <Award size={24} className="text-[#8c25f4]" />
                            <Typography variant="h2" className="m-0 italic tracking-tighter text-3xl">Reliability Rank_</Typography>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-black/40 rounded-3xl border border-white/5 text-center space-y-3 group hover:border-[var(--color-secondary)]/40 transition-all">
                                <span className="block text-4xl font-black text-[var(--color-secondary)] italic m-0">9.8</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Sync Integrity</span>
                            </div>
                            <div className="p-8 bg-black/40 rounded-3xl border border-white/5 text-center space-y-3 group hover:border-[var(--color-primary)]/40 transition-all">
                                <span className="block text-4xl font-black text-white italic m-0">2.4k</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Mesh Points</span>
                            </div>
                        </div>
                    </motion.section>
                </div>

                {/* Primary Systems (8 cols) */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Tech Stack Matrix */}
                    <motion.section variants={itemVariants} className="glass-panel p-12 rounded-[3.5rem] border-white/5 bg-black/40 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Cpu size={140} className="text-[#13ecec]" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-8 border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30 shadow-2xl shadow-[var(--color-secondary)]/10">
                                    <Code size={32} />
                                </div>
                                <div className="space-y-1">
                                    <Typography variant="h2" className="m-0 italic tracking-tighter text-4xl">System Architecture_</Typography>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Core Tech Stack Specifications</p>
                                </div>
                            </div>
                            <Button variant="secondary" className="px-10 h-16 rounded-2xl text-[10px] font-black italic uppercase tracking-widest shadow-xl border-white/5 bg-black/40 hover:bg-[var(--color-secondary)] hover:text-black transition-all">
                                EXPAND CORE_
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {profileData.skills.length > 0 ? profileData.skills.map((skill, index) => (
                                <motion.div 
                                    key={index}
                                    whileHover={{ scale: 1.05, y: -4, borderColor: '#13ecec' }}
                                    className="px-8 py-5 bg-white/5 border-2 border-transparent rounded-[1.8rem] flex items-center gap-4 group cursor-pointer transition-all shadow-xl hover:shadow-[#13ecec]/10"
                                >
                                    <div className="size-2.5 rounded-full bg-[#13ecec] shadow-[0_0_10px_#13ecec] group-hover:animate-ping" />
                                    <span className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-[#13ecec] transition-colors">{skill}</span>
                                </motion.div>
                            )) : (
                                <div className="w-full py-16 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                    <p className="text-slate-600 italic text-xl font-bold">Synchronize neural skills to populate architecture matrix_</p>
                                </div>
                            )}
                        </div>
                    </motion.section>

                    {/* Career Trajectory */}
                    <motion.section variants={itemVariants} className="glass-panel p-16 rounded-[3.5rem] border-white/10 overflow-hidden bg-black/60 shadow-2xl relative">
                        <div className="flex items-center gap-6 mb-16">
                            <div className="p-4 rounded-3xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-2xl">
                                <Briefcase size={32} />
                            </div>
                            <div className="space-y-1">
                                <Typography variant="h2" className="m-0 italic tracking-tighter text-4xl">Temporal Trajectory_</Typography>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Experience Sequence Log</p>
                            </div>
                        </div>
                        
                        <div className="relative space-y-20 before:absolute before:inset-0 before:ml-[44px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[var(--color-primary)] before:via-[var(--color-secondary)] before:to-transparent">
                            {[
                                { role: 'System Architect', company: 'TalentSphere', time: 'Present', desc: 'Engineering the next-gen neural recruitment interface with high-fidelity cinematic architectures.', active: true },
                                { role: 'Neural Engineer', company: 'Vector Systems', time: '2023 - 2024', desc: 'Architected high-concurrency matrix processing nodes and global state synchronization protocols.', active: false },
                                { role: 'Interface Designer', company: 'Nexus Labs', time: '2021 - 2023', desc: 'Developed premium design languages and glassmorphic interface systems for enterprise meshes.', active: false },
                            ].map((job, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="relative flex items-start pl-28 group"
                                >
                                    {/* Timeline Node */}
                                    <div className={cn(
                                        "absolute left-0 mt-2 size-24 rounded-[2rem] border-4 transition-all duration-1000 group-hover:animate-pulse z-10",
                                        job.active 
                                            ? "bg-[var(--color-primary)] border-[var(--color-primary)]/40 shadow-[0_0_40px_var(--color-primary-glow)] scale-110" 
                                            : "bg-black border-white/5 group-hover:border-[var(--color-secondary)]/40 group-hover:shadow-[0_0_30px_var(--color-secondary-glow)]"
                                    )}>
                                        <div className="w-full h-full rounded-[1.8rem] flex items-center justify-center bg-black/40">
                                            {job.active ? <Rocket size={32} className="text-white" /> : <Activity size={32} className="text-slate-700 group-hover:text-[var(--color-secondary)] transition-colors" />}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <Typography variant="h2" className={cn("text-4xl italic tracking-tighter m-0 transition-all", job.active ? "text-white" : "text-slate-500 group-hover:text-white")}>
                                                {job.role}_
                                            </Typography>
                                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                                                <span className="text-[9px] font-black text-[#13ecec] uppercase tracking-widest italic">{job.time}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="size-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
                                            <p className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.4em] italic leading-none">{job.company} Sequence_</p>
                                        </div>
                                        <p className="text-slate-400 font-medium italic text-xl leading-relaxed max-w-2xl opacity-70 group-hover:opacity-100 transition-all duration-500">
                                            {job.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Academic Foundation */}
                    <motion.section variants={itemVariants} className="glass-panel p-12 rounded-[3.5rem] border-white/10 bg-black/40 shadow-2xl">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="p-4 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <GraduationCap size={32} />
                            </div>
                            <div className="space-y-1">
                                <Typography variant="h2" className="m-0 italic tracking-tighter text-4xl">Knowledge Logic_</Typography>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Pre-Integrated Foundations</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { school: 'Matrix University', degree: 'M.S. Neural Computing', year: '2021', detail: 'Dissertation on High-Order Mesh Dynamics' },
                                { school: 'Vector Institute', degree: 'B.S. Interface Design', year: '2019', detail: 'Summa Cum Laude | UX/UI Synchronization' },
                            ].map((edu, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                    className="p-10 rounded-[2.5rem] bg-emerald-500/02 border-2 border-white/05 hover:border-emerald-500/40 transition-all group group/edu"
                                >
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter group-hover/edu:text-emerald-400 transition-colors uppercase">{edu.school}</h4>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="size-1.5 bg-emerald-500 rounded-full" />
                                        <p className="text-xs font-black text-[#8c25f4] uppercase italic tracking-[0.2em]">{edu.degree}</p>
                                    </div>
                                    <p className="text-slate-400 font-medium italic text-sm mt-5 leading-relaxed opacity-60 group-hover/edu:opacity-100 transition-opacity">{edu.detail}</p>
                                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black italic tracking-widest text-slate-700">
                                        <span>ACCREDITED_NODE</span>
                                        <span className="text-slate-500">{edu.year}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
};
