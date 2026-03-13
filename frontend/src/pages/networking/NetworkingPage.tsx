import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, X, 
    UserPlus, Check, Users,
    Briefcase, Activity, SlidersHorizontal
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/organisms/Toast';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';

const MOCK_PEOPLE = [
    { id: 'u1', name: 'Aanya Sharma', role: 'Senior Frontend Engineer', company: 'Google', initials: 'AS', skills: ['React', 'TypeScript', 'GraphQL'], mutualConnections: 4, matchPercent: 98, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop' },
    { id: 'u2', name: 'Rajan Mehta', role: 'Full Stack Developer', company: 'Razorpay', initials: 'RM', skills: ['Node.js', 'MongoDB', 'Vue.js'], mutualConnections: 2, matchPercent: 92, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop' },
    { id: 'u3', name: 'Priya Kumar', role: 'ML Engineer', company: 'Microsoft', initials: 'PK', skills: ['Python', 'TensorFlow', 'PyTorch'], mutualConnections: 6, matchPercent: 88, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop' },
    { id: 'u4', name: 'Arjun Nair', role: 'DevOps Engineer', company: 'Swiggy', initials: 'AN', skills: ['Kubernetes', 'Terraform', 'AWS'], mutualConnections: 1, matchPercent: 95, avatar: null },
    { id: 'u5', name: 'Meera Iyer', role: 'Product Manager', company: 'Atlassian', initials: 'MI', skills: ['Strategy', 'Agile', 'SQL'], mutualConnections: 8, matchPercent: 85, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop' },
    { id: 'u6', name: 'Siddharth Rao', role: 'Backend Engineer', company: 'Flipkart', initials: 'SR', skills: ['Go', 'gRPC', 'Kafka'], mutualConnections: 3, matchPercent: 91, avatar: null },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const NetworkingPage: React.FC = () => {
    const { addToast } = useToast();
    const [people, setPeople] = useState(MOCK_PEOPLE);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeLocation, setActiveLocation] = useState('Location');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [connections, setConnections] = useState<Record<string, 'pending' | 'connected' | null>>({});
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                setLoading(true);
                const params: any = {};
                if (search) params.search = search;
                
                const res = await api.get('/api/v1/users/profiles/discover', { params }).catch(() => null);
                if (res?.data?.profiles && res.data.profiles.length > 0) {
                    const enriched = res.data.profiles.map((p: any, index: number) => ({
                        ...p,
                        matchPercent: 80 + Math.floor(Math.random() * 20),
                        avatar: p.avatar || (index % 2 === 0 ? MOCK_PEOPLE[index % MOCK_PEOPLE.length].avatar : null)
                    }));
                    setPeople(enriched);
                } else if (!search) {
                     setPeople(MOCK_PEOPLE);
                }
            } catch (err) {
                console.error('Failed to fetch professionals', err);
                if (!search) setPeople(MOCK_PEOPLE);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchPeople, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const handleConnect = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const connectionStatus = connections[id];

        if (connectionStatus === 'pending') {
            addToast({ type: 'warning', title: 'Transmission Pending', message: 'Identity link resolve cycle already in progress.' });
            return;
        }
        
        setIsConnecting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConnections(prev => ({ ...prev, [id]: 'pending' }));
        setIsConnecting(false);
        addToast({ type: 'success', title: 'Signal Transmitted', message: 'Neural handshake initiated with node.' });
    };

    const removeFilter = (filter: string) => {
        setActiveFilters(activeFilters.filter(f => f !== filter));
    };

    const filtered = people.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase());
        const matchFilters = activeFilters.length === 0 || activeFilters.some(f => p.skills.includes(f));
        return matchSearch && matchFilters;
    });

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-7xl mx-auto pb-40 space-y-16 px-4 sm:px-0"
        >
            {/* Atmospheric Backgrounds */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-[#13ecec]/05 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Neural Directory Header */}
            <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8c25f4]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/30 shadow-lg">
                                <Users size={32} />
                            </div>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.3em] italic">Mesh Connectivity Protocol v5.0</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white text-7xl tracking-tighter m-0 italic">Neural Directory_</Typography>
                            <p className="text-slate-400 text-xl font-medium italic leading-relaxed max-w-2xl">
                                Discover and synchronize with high-affinity talent nodes across the global mesh. Establish persistent neural links.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 w-full lg:w-auto shrink-0">
                        <div className="glass-panel px-10 py-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center min-w-[140px] shadow-2xl">
                            <span className="text-4xl font-black text-white italic leading-none">1.2k+</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Active Nodes</span>
                        </div>
                        <div className="glass-panel px-10 py-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center min-w-[140px] shadow-2xl">
                            <span className="text-4xl font-black text-[#13ecec] italic leading-none">342</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Open Links</span>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Search & Interface Control */}
            <motion.div variants={itemVariants} className="space-y-8">
                <div className="glass-panel p-2 rounded-[3rem] border-white/10 flex flex-col lg:flex-row gap-4 items-center bg-black/40 backdrop-blur-3xl shadow-2xl">
                    <div className="relative flex-1 w-full bg-black/20 rounded-[2.5rem] flex items-center group">
                        <Search className="text-[#8c25f4] ml-8 group-focus-within:text-[#13ecec] transition-colors" size={24} />
                        <input 
                            className="w-full bg-transparent border-none py-7 pl-6 pr-8 text-white placeholder:text-slate-700 font-black text-xs uppercase tracking-widest italic outline-none focus:ring-0" 
                            placeholder="Search by role or expertise (e.g. Systems Bio-Architect)..." 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 w-full lg:w-auto px-2 lg:px-0">
                        <div className="relative flex-1 lg:w-60 h-20">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <select 
                                className="w-full h-full bg-white/5 border-white/5 rounded-2xl pl-16 pr-8 text-[10px] font-black text-slate-400 uppercase italic appearance-none cursor-pointer focus:border-[#13ecec]/30 outline-none hover:bg-white/10 transition-all shadow-lg"
                                value={activeLocation}
                                onChange={(e) => setActiveLocation(e.target.value)}
                            >
                                <option>Location Matrix</option>
                                <option>Remote Vector</option>
                                <option>Silicon Valley Hub</option>
                                <option>Euro-Central Area</option>
                                <option>Asia-Pacific Node</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="pr-4 hidden lg:block">
                        <Button variant="ghost" className="h-16 w-16 p-0 rounded-2xl bg-white/5 border-white/5 text-slate-500 hover:text-[#13ecec]">
                            <SlidersHorizontal size={24} />
                        </Button>
                    </div>
                </div>
                
                {/* Active Filter Cluster */}
                <AnimatePresence>
                    {activeFilters.length > 0 && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-wrap gap-4 overflow-hidden"
                        >
                            {activeFilters.map(filter => (
                                <motion.button 
                                    key={filter}
                                    layout
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    onClick={() => removeFilter(filter)}
                                    className="flex items-center gap-3 px-6 py-3 bg-[#8c25f4]/15 border border-[#8c25f4]/30 rounded-xl text-[10px] font-black text-[#8c25f4] uppercase tracking-[0.2em] italic hover:bg-[#8c25f4]/25 transition-all group"
                                >
                                    {filter} <X size={14} className="group-hover:rotate-90 transition-transform" />
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Talent Grid Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[450px] glass-panel rounded-[3.5rem] border-white/5 animate-pulse shadow-2xl" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-8 glass-panel rounded-[3.5rem] border-white/5 border-dashed bg-black/20">
                        <Activity size={80} className="text-slate-800 animate-pulse" />
                        <div className="space-y-2">
                            <Typography variant="h2" className="text-white italic tracking-tighter m-0">Zero Nodes Detected_</Typography>
                            <p className="text-slate-500 text-lg italic uppercase tracking-widest leading-relaxed">No high-affinity matches found in the current sector.</p>
                        </div>
                        <Button variant="secondary" className="px-12 py-5 scale-110" onClick={() => setSearch('')}>RE-SCAN GLOBAL MESH</Button>
                    </div>
                ) : (
                    filtered.map((person) => {
                        const isConnected = connections[person.id] === 'connected';
                        const isPending = connections[person.id] === 'pending';
                        
                        return (
                            <motion.div 
                                key={person.id}
                                variants={itemVariants}
                                whileHover={{ y: -15, borderTopColor: '#13ecec' }}
                                className="glass-panel p-10 rounded-[3.5rem] border-white/5 border-t-2 border-t-transparent relative overflow-hidden group hover:border-[#13ecec]/30 transition-all duration-500 bg-black/40 shadow-2xl flex flex-col"
                            >
                                {/* Affinity Status */}
                                <div className="absolute top-8 right-10 text-right">
                                    <div className="text-3xl font-black text-[#13ecec] italic leading-none">{person.matchPercent}%</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Compatibility</div>
                                </div>

                                <div className="flex flex-col items-center text-center space-y-8 flex-1">
                                    <div className="relative group/avatar">
                                        <div className="size-28 rounded-[2.5rem] bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2px] shadow-2xl transition-transform duration-700 group-hover:avatar:rotate-[15deg] group-hover:avatar:scale-105">
                                            <div className="w-full h-full rounded-[2.4rem] bg-[#050510] flex items-center justify-center overflow-hidden">
                                                {person.avatar ? (
                                                    <img className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src={person.avatar} alt={person.name} />
                                                ) : (
                                                    <span className="text-3xl font-black text-white italic">{person.initials}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 size-6 bg-[#13ecec] rounded-xl border-4 border-[#050510] shadow-[0_0_15px_rgba(19,236,236,0.5)] z-20" />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Typography variant="h3" className="text-white text-3xl group-hover:text-[#13ecec] transition-colors m-0 italic tracking-tighter">{person.name}_</Typography>
                                        <div className="px-4 py-1.5 bg-[#8c25f4]/15 rounded-full border border-[#8c25f4]/30 inline-block">
                                            <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">{person.role}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase italic flex items-center justify-center gap-2">
                                            <Briefcase size={12} className="text-[#13ecec]" /> {person.company}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {person.skills.slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-tight italic group-hover:border-white/10 transition-colors">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="w-full pt-8 space-y-4">
                                        <Button 
                                            variant={isConnected ? 'secondary' : 'primary'}
                                            fullWidth 
                                            size="lg"
                                            onClick={(e) => handleConnect(person.id, e)}
                                            disabled={isConnected || isPending}
                                            isLoading={isConnecting && isPending}
                                            className="py-5 rounded-2xl text-[10px] italic font-black uppercase tracking-[0.2em] shadow-xl"
                                        >
                                            {isConnected ? (
                                                <span className="flex items-center gap-2">SYNCHRONIZED <Check size={14} /></span>
                                            ) : isPending ? (
                                                'SYNC PENDING...'
                                            ) : (
                                                <span className="flex items-center gap-2 text-[#fff]">ESTABLISH LINK <UserPlus size={14} /></span>
                                            )}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            fullWidth 
                                            size="sm" 
                                            className="text-[9px] font-black italic border-white/5 opacity-40 hover:opacity-100 uppercase tracking-[0.3em] hover:text-[#13ecec]"
                                        >
                                            View Neural Bio_
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
};
