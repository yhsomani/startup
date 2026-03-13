import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Share2, Rocket, Map,
    TrendingUp, HeartPulse, Globe, Users,
    Calendar, Briefcase, Zap, ChevronRight,
    Building2, ExternalLink, ShieldCheck, Activity
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';

// Mock fallback
const MOCK_COMPANY = {
    id: '1', name: 'TechFlow Solutions', industry: 'Software Development', size: '250-500',
    location: 'Bangalore, India', website: 'https://techflow.io', founded: '2018',
    description: 'TechFlow Solutions builds cutting-edge developer tools and productivity platforms that are trusted by over 2M engineers worldwide. We are a remote-first company with a deep engineering culture.',
    culture: ['Remote-first', 'Open Source', 'Continuous Learning', 'Work-Life Balance'],
    initials: 'TS',
    employees: [
        { id: 'u1', name: 'Aanya Sharma', role: 'Senior Engineer', company: 'TechFlow', initials: 'AS', skills: ['React', 'Go', 'K8s'], mutualConnections: 3 },
        { id: 'u2', name: 'Rajan Mehta', role: 'Product Lead', company: 'TechFlow', initials: 'RM', skills: ['Strategy', 'Agile', 'SQL'], mutualConnections: 1 },
        { id: 'u3', name: 'Priya Kumar', role: 'ML Engineer', company: 'TechFlow', initials: 'PK', skills: ['Python', 'TensorFlow'], mutualConnections: 0 },
    ],
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const CompanyProfilePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<typeof MOCK_COMPANY | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [companyJobs, setCompanyJobs] = useState<any[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    useEffect(() => {
        const fetchCompanyAndJobs = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/v1/companies/${id}`).catch(() => null);
                const companyData = res?.data?.company || res?.data || MOCK_COMPANY;
                setCompany(companyData);

                // Fetch jobs for this company
                setJobsLoading(true);
                const jobsRes = await api.get('/api/v1/jobs', { params: { search: companyData.name } }).catch(() => null);
                setCompanyJobs(jobsRes?.data?.jobs || []);
            } catch (err) {
                console.error('Failed to fetch corporate biometrics', err);
                setCompany(MOCK_COMPANY);
            } finally {
                setLoading(false);
                setJobsLoading(false);
            }
        };
        fetchCompanyAndJobs();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-10">
                <div className="relative size-24">
                    <div className="absolute inset-0 border-4 border-[#13ecec]/10 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-4 border-[#13ecec]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[#13ecec] border-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="text-[#13ecec] animate-pulse" size={32} />
                    </div>
                </div>
                <Typography variant="label" className="text-slate-500 italic uppercase tracking-[0.4em] text-xs">Acquiring Corporate Bio-metrics_</Typography>
            </div>
        );
    }

    const c = company || MOCK_COMPANY;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-6xl mx-auto pb-40 space-y-20 px-4 sm:px-0"
        >
            {/* Atmospheric Backgrounds */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[10%] right-[-10%] w-[700px] h-[700px] bg-[#8c25f4]/05 blur-[150px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-[#13ecec]/05 blur-[120px] rounded-full" />
            </div>

            {/* Corporate Identity Header */}
            <motion.section variants={itemVariants} className="relative group">
                <div className="glass-panel rounded-[4rem] overflow-hidden border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-black/40">
                    <div className="h-[400px] w-full relative overflow-hidden">
                        {/* Interactive Parallax Background Layer */}
                        <motion.div 
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.4 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute inset-0 bg-center bg-no-repeat bg-cover mix-blend-overlay grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#13ecec]/10 via-transparent to-[#8c25f4]/15 pointer-events-none" />
                        
                        <div className="absolute top-10 left-12 z-20 flex gap-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-4 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 text-white hover:bg-white/15 transition-all hover:scale-110 active:scale-95"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        </div>
                        <div className="absolute top-10 right-12 z-20 flex gap-4">
                            <button className="p-4 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 text-white hover:bg-white/15 transition-all hover:scale-110 active:scale-95">
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="px-16 pb-16 -mt-24 relative z-30">
                        <div className="flex flex-col lg:flex-row items-end gap-12">
                            {/* Corporate Node Core */}
                            <div className="size-48 rounded-[3.5rem] bg-gradient-to-br from-[#13ecec] to-[#8c25f4] p-[3px] shadow-[0_0_50px_rgba(19,236,236,0.2)] relative shrink-0">
                                <div className="w-full h-full rounded-[3.3rem] bg-[#050510] flex items-center justify-center overflow-hidden">
                                    <div className="size-24 rounded-3xl bg-white/5 flex items-center justify-center text-[#13ecec] border border-white/5 shadow-inner">
                                        <Typography variant="h1" className="text-white mb-0 text-5xl tracking-tighter italic">{c.initials}</Typography>
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 -right-3 size-14 rounded-2xl bg-[#8c25f4] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(140,37,244,0.4)] border-8 border-[#050510] z-20">
                                    <Building2 size={28} />
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-6 pb-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="px-4 py-1.5 bg-[#13ecec]/10 rounded-full border border-[#13ecec]/30 flex items-center gap-2 backdrop-blur-xl">
                                        <ShieldCheck size={16} className="text-[#13ecec]" />
                                        <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.2em] italic">Verified Corporate Entity</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-xl">
                                        <Map size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{c.location}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Typography variant="h1" className="text-white text-7xl tracking-tighter italic m-0">
                                        {c.name}_
                                    </Typography>
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 bg-[#8c25f4] rounded-full animate-pulse" />
                                        <Typography variant="h3" className="text-[#8c25f4] italic tracking-[0.3em] uppercase text-xl mb-0">
                                            {c.industry}
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full lg:w-auto pb-4">
                                <Button 
                                    variant={isFollowing ? 'secondary' : 'primary'}
                                    size="lg"
                                    onClick={() => setIsFollowing(!isFollowing)}
                                    className="flex-1 lg:flex-none px-16 h-20 rounded-[2rem] text-[12px] font-black italic uppercase tracking-[0.2em] shadow-2xl"
                                >
                                    {isFollowing ? 'SYNC ACTIVE' : 'SYNCHRONIZE INTERFACE_'}
                                </Button>
                                <Button variant="ghost" size="lg" className="h-20 w-20 p-0 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10" onClick={() => window.open(c.website, '_blank')}>
                                    <ExternalLink size={24} className="text-slate-400" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Strategic Intelligence & Personnel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Core Bio-Data (8 cols) */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Matrix Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Neural Mesh Size', value: c.size, icon: Users, color: '#13ecec' },
                            { label: 'Strategic Sector', value: c.industry.split(' ')[0], icon: Briefcase, color: '#8c25f4' },
                            { label: 'Continuity Index', value: `Since ${c.founded}`, icon: Calendar, color: '#10b981' },
                        ].map((m, i) => (
                            <motion.div key={i} variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all text-center group shadow-xl">
                                <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <m.icon style={{ color: m.color }} size={32} />
                                </div>
                                <Typography variant="label" className="text-slate-500 mb-2 block uppercase tracking-widest text-[10px] font-black italic">{m.label}</Typography>
                                <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{m.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Strategic Mission Node */}
                    <motion.section variants={itemVariants} className="glass-panel p-16 rounded-[3.5rem] border-white/5 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
                            <Building2 size={280} className="text-[#13ecec]" />
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-10">
                                <div className="p-3 rounded-2xl bg-[#13ecec]/10 text-[#13ecec] border border-[#13ecec]/20 shadow-lg">
                                    <Globe size={28} />
                                </div>
                                <Typography variant="h2" className="m-0 italic tracking-tighter">Strategic Overview_</Typography>
                            </div>
                            <p className="text-slate-400 font-bold leading-relaxed italic text-2xl opacity-90 tracking-tight">
                                {c.description}
                            </p>
                        </div>
                    </motion.section>

                    {/* Cultrual Protocols */}
                    <motion.section variants={itemVariants} className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/20">
                                <HeartPulse size={24} />
                            </div>
                            <Typography variant="h2" className="m-0 italic tracking-tighter">Corporate Ecosystem_</Typography>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {c.culture?.map((feature: string, i: number) => {
                                const icons = [Map, TrendingUp, HeartPulse, Rocket];
                                const Icon = icons[i % icons.length];
                                return (
                                    <div key={i} className="glass-panel p-10 rounded-[2.5rem] border-white/5 hover:border-[#13ecec]/50 transition-all text-center group bg-black/40 shadow-xl">
                                        <Icon className="mx-auto mb-6 text-[#13ecec] group-hover:animate-pulse transition-transform" size={40} />
                                        <p className="text-white font-black italic uppercase text-[10px] tracking-[0.2em]">{feature}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.section>
                </div>

                {/* Tactical Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Active Opportunity Nodes */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3rem] border-[#13ecec]/30 shadow-[0_0_50px_rgba(19,236,236,0.1)] space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Zap className="text-[#13ecec] animate-pulse" size={24} />
                                <Typography variant="h3" className="m-0 italic tracking-tighter">Opportunity Nodes_</Typography>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 italic bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">LIVE SCAN</span>
                        </div>
                        
                        <div className="space-y-6">
                            {jobsLoading ? (
                                <div className="py-10 flex justify-center">
                                    <Activity className="text-slate-700 animate-spin" size={32} />
                                </div>
                            ) : companyJobs.length > 0 ? (
                                companyJobs.slice(0, 3).map(job => (
                                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="glass-panel p-8 rounded-[2rem] border-white/5 hover:border-[#8c25f4]/50 transition-all group/job cursor-pointer bg-black/20 shadow-xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-xl font-black italic tracking-tighter text-white group-hover/job:text-[#13ecec] transition-colors">{job.title}_</h4>
                                            <span className="text-[9px] font-black bg-[#13ecec]/20 text-[#13ecec] px-3 py-1 rounded-lg italic border border-[#13ecec]/30 shadow-lg">PRIORITY</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">{job.type || 'Full-time'} • {job.salary || 'Competitive'} USD</p>
                                        <Button variant="ghost" size="sm" className="w-full text-[10px] italic border-white/5 py-4 group-hover/job:border-[#13ecec]/40 group-hover/job:bg-white/5 transition-all">
                                            ACQUIRE CARRIER_
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                    <Typography variant="label" className="text-slate-700 uppercase italic tracking-widest">No active nodes in matrix.</Typography>
                                </div>
                            )}
                            
                            <Button variant="secondary" className="w-full h-16 rounded-[1.5rem] text-[10px] font-black italic uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                                <span className="flex items-center justify-center gap-2">
                                    Expand Sector Scan
                                    <ChevronRight size={18} />
                                </span>
                            </Button>
                        </div>
                    </motion.section>

                    {/* Global Personnel Mesh */}
                    <motion.section variants={itemVariants} className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-10 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <Users className="text-[#8c25f4]" size={24} />
                            <Typography variant="h3" className="m-0 italic tracking-tighter">Personnel Mesh_</Typography>
                        </div>
                        <div className="space-y-6">
                            {c.employees?.slice(0, 3).map((emp: any) => (
                                <div key={emp.id} className="flex items-center gap-6 group/emp cursor-pointer">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2px] group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                                        <div className="w-full h-full rounded-[0.9rem] bg-black flex items-center justify-center text-xs font-black text-white italic">
                                            {emp.initials}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-black text-white italic truncate group-hover:text-[#13ecec] transition-colors">{emp.name}_</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{emp.role}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-800 group-hover:text-[#8c25f4] transition-all" />
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full h-16 text-[10px] italic border-white/10 opacity-40 hover:opacity-100 hover:text-[#13ecec] transition-all uppercase tracking-[0.3em]">
                            Global Team Manifesto_
                        </Button>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
};
