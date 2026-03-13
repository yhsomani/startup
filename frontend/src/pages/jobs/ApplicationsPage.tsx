import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Clock, Target, Activity, 
    Building2, MapPin
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface ApplicationVector {
    id: string;
    jobTitle: string;
    company: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Rejected';
    appliedDate: string;
    location: string;
    affinity: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const vectorVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

const ProgressiveOrb: React.FC<{ status: ApplicationVector['status'] }> = ({ status }) => {
    const stages = ['Applied', 'Screening', 'Interview', 'Offered'];
    const currentIndex = stages.indexOf(status === 'Rejected' ? 'Applied' : status);
    const progress = ((currentIndex + 1) / stages.length) * 100;
    
    return (
        <div className="relative size-24 shrink-0 flex items-center justify-center">
            {/* Background Trace */}
            <svg className="absolute inset-0 size-full -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                <motion.circle 
                    cx="48" cy="48" r="44" 
                    stroke={status === 'Rejected' ? '#ef4444' : '#13ecec'} 
                    strokeWidth="6" 
                    fill="none"
                    strokeDasharray="276"
                    initial={{ strokeDashoffset: 276 }}
                    animate={{ strokeDashoffset: 276 - (276 * progress) / 100 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    strokeLinecap="round"
                />
            </svg>
            
            <div className={cn(
                "size-14 rounded-full flex items-center justify-center shadow-2xl relative z-10",
                status === 'Rejected' ? "bg-red-500/20 text-red-400" : "bg-[#13ecec]/20 text-[#13ecec]"
            )}>
                <Target size={24} className={cn(status !== 'Rejected' && "animate-pulse")} />
            </div>

            {/* Pulsing Signal Glow */}
            {status !== 'Rejected' && (
                <div className="absolute inset-0 bg-[#13ecec]/5 rounded-full blur-xl animate-pulse" />
            )}
        </div>
    );
};

export const ApplicationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<ApplicationVector[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('All Vectors');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/v1/jobs/applications').catch(() => null);
                
                // MOCK enriched
                const enriched: ApplicationVector[] = (res?.data?.applications || [
                    { id: '1', jobTitle: 'Systems Architect', company: 'Neuralink', status: 'Interview', appliedDate: '2024-03-10', location: 'Remote', affinity: 96 },
                    { id: '2', jobTitle: 'Frontend Protocol Lead', company: 'SpaceX', status: 'Offered', appliedDate: '2024-03-08', location: 'California', affinity: 92 },
                    { id: '3', jobTitle: 'ML Engineer', company: 'DeepMind', status: 'Applied', appliedDate: '2024-03-05', location: 'London', affinity: 89 }
                ]).map((a: any) => ({
                    ...a,
                    affinity: a.affinity || 80 + Math.floor(Math.random() * 19)
                }));
                
                setApplications(enriched);
            } catch (err) {
                console.error('Failed to acquire application vectors', err);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    const filtered = applications.filter(a => {
        const matchesSearch = a.jobTitle.toLowerCase().includes(search.toLowerCase()) || a.company.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = activeStatus === 'All Vectors' || a.status === activeStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-12 pb-40 px-4 sm:px-0"
        >
            {/* Atmospheric Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full" />
            </div>

            {/* Vector Tracking Header */}
            <motion.section variants={vectorVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/20 shadow-lg">
                                <Activity size={24} />
                            </div>
                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.3em] italic">Active Vector Streams</span>
                            </div>
                        </div>
                        <Typography variant="h1" className="text-white text-6xl tracking-tighter italic m-0">Vector Tracking_</Typography>
                        <p className="text-slate-400 text-lg font-medium italic max-w-xl">
                            Monitoring high-affinity carrier signals across the global mesh. Status validation in progress.
                        </p>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="glass-panel px-8 py-6 rounded-3xl border-white/5 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-3xl font-black text-white italic leading-none">{applications.length}</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Live Signals</span>
                        </div>
                        <div className="glass-panel px-8 py-6 rounded-3xl border-white/5 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-3xl font-black text-[#13ecec] italic leading-none">
                                {applications.filter(a => a.status === 'Offered' || a.status === 'Interview').length}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Acquisitions</span>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Operations: Search & Filter */}
            <motion.div variants={vectorVariants} className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 glass-panel p-2 rounded-3xl border-white/5 flex items-center bg-black/40 group focus-within:border-[#13ecec]/40 transition-all">
                    <Search className="text-[#8c25f4] ml-6 group-focus-within:text-[#13ecec] transition-colors" size={20} />
                    <input 
                        className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 w-full py-5 px-4 font-black text-xs uppercase tracking-widest italic outline-none"
                        placeholder="Scan Specific Carrier Signal..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {['All Vectors', 'Applied', 'Screening', 'Interview', 'Offered'].map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={cn(
                                "h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest italic transition-all whitespace-nowrap border-2",
                                activeStatus === status
                                    ? "bg-[#13ecec]/10 text-[#13ecec] border-[#13ecec]/40 shadow-[0_0_20px_rgba(19,236,236,0.1)]"
                                    : "glass-panel border-white/5 text-slate-600 hover:text-white hover:border-white/20"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Vector Signals Grid */}
            <main className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 glass-panel rounded-[2.5rem] border-white/5 animate-pulse shadow-2xl" />
                        ))
                    ) : filtered.length > 0 ? (
                        filtered.map((vector) => (
                            <motion.div
                                key={vector.id}
                                variants={vectorVariants}
                                layout
                                whileHover={{ x: 10, borderLeftColor: '#13ecec' }}
                                className="glass-panel p-10 rounded-[3rem] border-white/5 border-l-4 border-l-transparent hover:border-[#13ecec]/30 transition-all duration-300 bg-black/40 group flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl"
                            >
                                <ProgressiveOrb status={vector.status} />

                                <div className="flex-1 space-y-4 text-center md:text-left">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-colors">
                                            {vector.jobTitle}_
                                        </h3>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">
                                                <Building2 size={12} /> {vector.company}
                                            </div>
                                            <span className="text-slate-800 hidden md:inline">|</span>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                <MapPin size={12} /> {vector.location}
                                            </div>
                                            <span className="text-slate-800 hidden md:inline">|</span>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                <Clock size={12} /> Sync Established {vector.appliedDate}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                        {['High Priority', 'Vetted', 'Verified'].map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-400 group-hover:border-white/10 transition-colors">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-6 shrink-0 w-full md:w-auto">
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-white italic tracking-tighter leading-none">{vector.affinity}%</div>
                                        <div className="text-[9px] font-black text-[#13ecec] uppercase tracking-widest mt-1 italic">Signal Strength</div>
                                    </div>
                                    
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Button variant="ghost" size="sm" className="px-5 border-white/5 bg-white/5 hover:bg-white/10">
                                            HISTORY_
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            className="px-8 text-[10px] font-black italic tracking-widest shadow-[0_0_30px_rgba(19,236,236,0.1)]"
                                            onClick={() => navigate(`/jobs/${vector.id}`)}
                                        >
                                            RE-SYNC_
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-40 flex flex-col items-center justify-center text-center glass-panel rounded-[3rem] border-white/5 border-dashed bg-black/20">
                            <Target size={64} className="text-slate-800 mb-8" />
                            <Typography variant="h2" className="text-white italic tracking-tighter m-0">No Vector Presence_</Typography>
                            <p className="text-slate-500 mt-4 italic text-lg max-w-sm">No active signals found for this coordinate. Adjust the matrix query.</p>
                            <Button variant="secondary" className="mt-12 px-12 scale-110">RESET TRACKING</Button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </motion.div>
    );
};
