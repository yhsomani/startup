import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Bookmark, Share2, MapPin, Activity,
    Users, TrendingUp, Target, Cpu, CheckCircle,
    Layers, IndianRupee, Zap, ShieldPlus, Rocket,
    Sparkles
} from 'lucide-react';
import { useToast } from '../../components/organisms/Toast';
import { JobApplicationModal } from './components/JobApplicationModal';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';

interface JobDetails {
    id: string;
    title: string;
    company_id: string;
    companyName: string;
    location: string;
    type: string;
    salaryRange: string;
    postedAt: string;
    experience: string;
    vacancies: number;
    tags: string[];
    description: string;
    requirements: string[];
    benefits: string[];
    remote: boolean;
    logo_url?: string;
    tech_stack?: string[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } }
};

export const JobDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [jobData, setJobData] = useState<JobDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [applyForm, setApplyForm] = useState({
        resumeUrl: '',
        coverLetter: ''
    });

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const response = await api.get(`/api/v1/jobs/${id}`).catch(() => null);
                const data = response?.data;
                
                const mockData = {
                    id: id,
                    title: 'Senior Systems Architect',
                    company_id: 'c1',
                    companyName: 'TalentSphere Labs',
                    location: 'Palo Alto, CA',
                    type: 'Full-time',
                    salaryRange: '$180k - $240k',
                    postedAt: 'Posted 2h ago',
                    experience: '8+ Years',
                    vacancies: 2,
                    tags: ['Architecture', 'Cloud', 'Distributed Systems'],
                    description: 'Pioneer the next generation of professional matchmaking infrastructure. We are building massive-scale graph processing systems to connect talent with opportunity at sub-millisecond speeds.',
                    requirements: ['Distributed Systems Design', 'Rust/Go Expertise', 'Kubernetes Orchestration', 'Graph Database Mastery'],
                    benefits: ['Full Suite Healthcare', 'Unlimited Access to Neural APIs', 'Relocation Package', 'Performance Alpha Bonus'],
                    remote: true,
                    logo_url: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=200&h=200',
                    tech_stack: ['Rust', 'PostgreSQL', 'Kafka', 'Redis', 'AWS']
                };

                if (data) {
                    setJobData({
                        ...mockData,
                        id: data.id,
                        title: data.title,
                        companyName: data.company_name || mockData.companyName,
                        location: data.location || mockData.location,
                        type: data.employment_type || mockData.type,
                        description: data.description || mockData.description,
                    });
                } else {
                    setJobData(mockData);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsApplying(true);
        try {
            await api.post(`/api/v1/jobs/${id}/apply`, {
                coverLetter: applyForm.coverLetter,
                resume: applyForm.resumeUrl
            });
            setIsApplyModalOpen(false);
            addToast({ type: 'success', title: 'Transmission Received', message: 'Your application has been successfully synchronized.' });
        } catch (error: any) {
            addToast({ type: 'error', title: 'Sync Error', message: error.response?.data?.message || 'Failed to transmit application.' });
        } finally {
            setIsApplying(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col justify-center items-center h-screen bg-[#0a070d]">
            <div className="relative size-24 mb-8">
                <div className="absolute inset-0 border-2 border-[#8c25f4]/20 rounded-[2.5rem] rotate-45"></div>
                <div className="absolute inset-0 border-2 border-[#8c25f4] border-t-transparent rounded-[2.5rem] rotate-45 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#8c25f4]">
                    <Activity size={32} className="animate-pulse" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-[0.4em] italic animate-pulse">Syncing Specifications_</span>
                <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest italic">NEURAL_DECODING_IN_PROGRESS</span>
            </div>
        </div>
    );

    if (!jobData) return null;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative space-y-12 pb-32 min-h-screen"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#8c25f4]/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#13ecec]/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Cinematic Hero Header */}
            <motion.section variants={itemVariants} className="relative h-[600px] w-full glass-panel rounded-[3.5rem] border-white/5 overflow-hidden group shadow-3xl">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#0a070d] z-10" />
                <div 
                    className="absolute inset-0 grayscale opacity-40 bg-cover bg-center transition-transform duration-[3000ms] group-hover:scale-105" 
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1920&h=800")' }}
                />
                
                {/* Neural Overlay */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 size-[500px] bg-[#8c25f4]/20 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 size-[600px] bg-[#13ecec]/15 blur-[180px] rounded-full animate-pulse delay-1000" />
                </div>

                <div className="relative z-20 h-full p-12 lg:p-16 flex flex-col">
                    <div className="flex justify-between items-center">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate('/jobs')} 
                            className="px-8 py-4 rounded-2xl bg-black/40 border-white/10 text-[10px] font-black uppercase italic tracking-[0.3em] hover:border-[#13ecec]/30 hover:bg-white/5 group/back"
                        >
                            <ArrowLeft size={18} className="mr-4 text-[#13ecec] transition-transform group-hover/back:-translate-x-1" /> BACK TO RADAR
                        </Button>
                        <div className="flex gap-4">
                            <button className="size-16 rounded-[1.5rem] bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all shadow-xl hover:border-[#8c25f4]/30">
                                <Bookmark size={24} strokeWidth={1.5} />
                            </button>
                            <button className="size-16 rounded-[1.5rem] bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all shadow-xl hover:border-[#13ecec]/30">
                                <Share2 size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col lg:flex-row items-center lg:items-end justify-between gap-12">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-12">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, type: 'spring' }}
                                className="size-48 rounded-[3.5rem] bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[3px] shadow-[0_0_50px_rgba(140,37,244,0.3)] shrink-0 group/logo relative"
                            >
                                <div className="absolute inset-0 bg-white/20 blur-md rounded-[3.5rem] opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                                <div className="w-full h-full rounded-[3.4rem] bg-black flex items-center justify-center overflow-hidden relative">
                                    <img src={jobData.logo_url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover/logo:scale-110" />
                                </div>
                            </motion.div>
                            <div className="space-y-8 text-center md:text-left">
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <span className="px-5 py-2 bg-[#8c25f4]/15 border border-[#8c25f4]/30 text-[#8c25f4] text-[10px] font-black uppercase tracking-[0.3em] rounded-xl italic">EXP: {jobData.experience}</span>
                                    <div className="px-5 py-2 bg-[#13ecec]/15 border border-[#13ecec]/30 text-[#13ecec] text-[10px] font-black uppercase tracking-[0.3em] rounded-xl italic flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-[#13ecec] animate-pulse" />
                                        AFFINITY: 98%
                                    </div>
                                </div>
                                <Typography variant="h1" className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-white italic">
                                    {jobData.title}_
                                </Typography>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-8 text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] italic">
                                    <span className="text-white tracking-[0.2em]">{jobData.companyName}</span>
                                    <div className="size-1.5 bg-[#8c25f4] rounded-full shadow-[0_0_15px_#8c25f4]" />
                                    <span className="flex items-center gap-4"><MapPin size={20} className="text-[#13ecec]" /> {jobData.location}</span>
                                    <div className="size-1.5 bg-[#13ecec] rounded-full shadow-[0_0_15px_#13ecec]" />
                                    <span className="text-[#10b981]">{jobData.postedAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Content Mesh */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Left Detail Stream */}
                <div className="lg:col-span-2 space-y-24">
                    {/* Operational Signals */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            { label: 'Role Competition', value: 'Critical', icon: Users, color: '#8c25f4', desc: 'High Affinity Pool' },
                            { label: 'Growth Vector', value: '+18%', icon: TrendingUp, color: '#10b981', desc: 'Sector Expansion' },
                            { label: 'Salary Percentile', value: '98th', icon: Target, color: '#13ecec', desc: 'Top Tier Yield' },
                        ].map(sig => (
                            <section key={sig.label} className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-6 bg-black/40 group hover:border-[#13ecec]/20 transition-all shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
                                    <sig.icon size={120} />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform shadow-xl" style={{ color: sig.color }}>
                                        <sig.icon size={26} />
                                    </div>
                                    <div className="px-3 py-1.5 bg-white/5 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{sig.desc}</div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-2 leading-none">{sig.label}</p>
                                    <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{sig.value}</p>
                                </div>
                            </section>
                        ))}
                    </div>

                    <section className="space-y-12">
                        <div className="flex items-center gap-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#13ecec] leading-none">Mission Objectives_</h3>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#13ecec]/30 via-[#13ecec]/10 to-transparent" />
                        </div>
                        <div className="relative">
                            <div className="absolute -left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8c25f4] via-[#13ecec] to-transparent rounded-full opacity-30" />
                            <p className="text-2xl text-slate-400 leading-relaxed font-medium italic first-letter:text-8xl first-letter:font-black first-letter:text-[#8c25f4] first-letter:mr-6 first-letter:float-left first-letter:mt-2 first-letter:leading-none">
                                {jobData.description}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-12">
                        <div className="flex items-center gap-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#8c25f4] leading-none">Neural Requirements_</h3>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#8c25f4]/30 via-[#8c25f4]/10 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {jobData.requirements.map((req, i) => (
                                <div key={i} className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-black/40 group hover:border-[#13ecec]/30 transition-all relative overflow-hidden shadow-2xl">
                                    <div className="absolute -right-12 -bottom-12 opacity-[0.02] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-1000">
                                        <Cpu size={180} />
                                    </div>
                                    <div className="relative z-10 flex items-start gap-8">
                                        <div className="size-14 bg-[#10b981]/10 border border-[#10b981]/20 rounded-[1.5rem] flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white uppercase italic tracking-widest mb-3 leading-tight">{req}_</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full w-full bg-[#10b981] animate-pulse" />
                                                </div>
                                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Signal Verified</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-12 pb-12">
                        <div className="flex items-center gap-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#13ecec] leading-none">The Tech Stack_</h3>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#13ecec]/30 via-[#13ecec]/10 to-transparent" />
                        </div>
                        <div className="flex flex-wrap gap-6">
                            {jobData.tech_stack?.map((tech, i) => (
                                <div key={i} className="px-10 py-6 glass-panel rounded-2xl border-white/5 flex items-center gap-5 bg-black/40 group hover:border-[#8c25f4]/30 hover:-translate-y-2 transition-all cursor-pointer shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Layers size={24} className="text-[#13ecec] group-hover:rotate-180 transition-transform duration-1000 relative z-10" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-white transition-colors relative z-10 italic">{tech}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Sticky Uplink Terminal */}
                <div className="space-y-10">
                    <div className="sticky top-24 space-y-10">
                        <section className="glass-panel p-12 lg:p-14 rounded-[4rem] border-white/10 bg-black/80 shadow-[0_30px_100px_rgba(0,0,0,0.6)] space-y-12 relative overflow-hidden group">
                            {/* Gravity Well */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-[#8c25f4]/15 blur-[120px] rounded-full group-hover:scale-150 transition-transform duration-[2000ms] pointer-events-none" />

                            <div className="relative z-10 space-y-12">
                                <div className="space-y-6">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic ml-1">Target Yield_</p>
                                    <div className="flex items-center gap-8">
                                        <div className="size-20 bg-[#10b981]/10 rounded-[2rem] flex items-center justify-center text-[#10b981] border border-[#10b981]/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                                            <IndianRupee size={36} />
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="h2" className="mb-0 text-white italic tracking-tighter leading-none text-4xl">{jobData.salaryRange}</Typography>
                                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">{jobData.type} Package</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <Button 
                                        size="lg" 
                                        fullWidth 
                                        onClick={() => setIsApplyModalOpen(true)}
                                        className="h-28 rounded-[2.5rem] text-sm font-black uppercase italic tracking-[0.4em] shadow-[0_0_50px_rgba(140,37,244,0.4)] hover:shadow-[0_0_70px_rgba(140,37,244,0.6)] active:scale-95 transition-all group/btn bg-gradient-to-r from-[#8c25f4] to-indigo-600 border-none"
                                    >
                                        <Zap size={26} className="mr-5 fill-white transition-transform group-hover/btn:scale-125 group-hover/btn:rotate-12" /> TRANSMIT SIGNAL_
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        fullWidth 
                                        className="h-20 rounded-[1.8rem] text-[10px] font-black uppercase italic tracking-[0.3em] border-white/5 hover:border-[#13ecec]/40 hover:bg-white/5"
                                    >
                                        TRACK NODE_
                                    </Button>
                                </div>

                                <div className="pt-12 border-t border-white/5 space-y-10">
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Orbit Privileges_</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        {jobData.benefits.slice(0, 4).map((ben, i) => (
                                            <div key={i} className="flex flex-col items-center p-8 glass-panel rounded-[2rem] text-center gap-6 group/ben bg-white/5 border-transparent hover:border-[#13ecec]/20 hover:-translate-y-1 transition-all duration-500">
                                                <div className="size-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#8c25f4] group-hover/ben:scale-110 group-hover/ben:text-[#13ecec] group-hover/ben:border-[#13ecec]/30 transition-all duration-700 shadow-xl">
                                                    {ben.toLowerCase().includes('health') ? <ShieldPlus size={28} strokeWidth={1} /> : <Rocket size={28} strokeWidth={1} />}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight italic group-hover:text-slate-300 transition-colors">{ben}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Network Affinity Card */}
                        <section className="glass-panel p-12 rounded-[3.5rem] border-[#13ecec]/30 bg-gradient-to-br from-[#13ecec]/10 to-transparent space-y-10 relative overflow-hidden group shadow-3xl">
                            <div className="absolute top-0 right-0 p-10 text-[#13ecec]/20 group-hover:rotate-12 transition-transform duration-1000 scale-150">
                                <Sparkles size={120} strokeWidth={0.5} />
                            </div>
                            
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-8">
                                    <div className="size-16 bg-[#13ecec] rounded-[1.8rem] flex items-center justify-center text-black shadow-[0_0_30px_rgba(19,236,236,0.5)] group-hover:rotate-[360deg] transition-transform duration-1000">
                                        <Users size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">Neural Mesh_</h4>
                                        <p className="text-[9px] font-black text-[#13ecec]/80 uppercase tracking-widest italic">Synchronization Active</p>
                                    </div>
                                </div>
                                <div className="flex -space-x-5 px-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div 
                                            key={i} 
                                            whileHover={{ y: -10, zIndex: 50, scale: 1.1 }}
                                            className="size-16 rounded-[1.5rem] border-4 border-[#0a070d] bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer shadow-2xl transition-all"
                                        >
                                            <img src={`https://i.pravatar.cc/100?img=${i+40}`} alt="" className="w-full h-full object-cover" />
                                        </motion.div>
                                    ))}
                                    <div className="size-16 rounded-[1.5rem] border-4 border-[#0a070d] bg-black flex items-center justify-center text-xs font-black text-[#13ecec] italic shadow-2xl relative z-10">
                                        +24
                                    </div>
                                </div>
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <p className="text-[11px] text-slate-400 font-black italic leading-relaxed uppercase tracking-tight">
                                        <span className="text-[#13ecec]">8 active nodes</span> in this sector match your <span className="text-white brightness-125 underline decoration-[#8c25f4] decoration-2 underline-offset-4">Distributed Systems</span> profile.
                                    </p>
                                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-[80%] bg-[#13ecec]" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <JobApplicationModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                isApplying={isApplying}
                jobTitle={jobData.title}
                companyName={jobData.companyName}
                applyForm={applyForm}
                setApplyForm={setApplyForm}
                onSubmit={handleApplySubmit}
            />
        </motion.div>
    );
};
