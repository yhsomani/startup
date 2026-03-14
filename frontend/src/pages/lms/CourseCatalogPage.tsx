import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Star, Clock, SlidersHorizontal,
    Brain, BookOpen, Zap, Trophy,
    PlayCircle, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface CourseNode {
    id: string;
    title: string;
    instructor: string;
    rating: number;
    students: string | number;
    duration: string;
    level: string;
    tags: string[];
    image?: string;
    price?: string;
    isFree?: boolean;
}

const MATRIX_CATEGORIES = ['All Nodes', 'Neural Systems', 'Quantum UI', 'Logic Mesh', 'Cyber Security', 'Bio-Data'];

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const nodeVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }
};

export const CourseCatalogPage: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<CourseNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Nodes');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const params: any = {};
                if (searchQuery) params.search = searchQuery;
                if (activeCategory !== 'All Nodes') params.category = activeCategory.toLowerCase();

                const res = await api.get('/api/v1/courses', { params }).catch(() => null);
                setCourses(res?.data?.courses || []);
            } catch (err) {
                console.error('Failed to fetch knowledge nodes', err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchCourses, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory]);

    return (
        <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 relative px-4 sm:px-0"
        >
            {/* Atmospheric Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--color-primary)]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--color-secondary)]/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Oracle Interface Section */}
            <motion.section variants={nodeVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 via-transparent to-[var(--color-secondary)]/10 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20 shadow-[0_0_20px_rgba(19,236,236,0.2)]">
                                <Brain size={32} />
                            </div>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.3em] italic">Knowledge Nexus Architecture</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white text-7xl leading-tight m-0 tracking-tighter italic">
                                Oracle Interface_
                            </Typography>
                            <p className="text-slate-400 text-xl font-medium italic max-w-xl leading-relaxed">
                                Synchronize your cognitive architecture with high-fidelity knowledge streams. Elevate your node ranking in the global mesh.
                            </p>
                        </div>
                    </div>

                    <div className="w-full lg:w-[500px] space-y-6">
                        <div className="glass-panel p-2 rounded-[2.5rem] border-white/10 flex items-center bg-black/40 backdrop-blur-3xl shadow-2xl group focus-within:border-[var(--color-secondary)]/40 transition-all">
                            <Search className="text-[var(--color-primary)] ml-6 group-focus-within:text-[var(--color-secondary)] transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="Neural Query Sequence..."
                                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 w-full py-6 px-4 font-black text-xs uppercase tracking-widest italic outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="mr-2 p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/5">
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                        <div className="flex gap-6 justify-center lg:justify-start">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <Activity size={16} className="text-[var(--color-secondary)] animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">2,482 Synchronized</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <Trophy size={16} className="text-[var(--color-primary)]" />
                                <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">Elite Tiers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Matrix Nodes Navigation */}
            <motion.div variants={nodeVariants} className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4">
                {MATRIX_CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={cn(
                            "flex h-16 shrink-0 items-center justify-center px-10 rounded-2xl font-black text-xs uppercase tracking-widest italic transition-all whitespace-nowrap border-2",
                            activeCategory === category
                                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[0_0_30px_rgba(140,37,244,0.4)] scale-105"
                                : "glass-panel border-white/5 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </motion.div>

            {/* Knowledge Nodes Catalog */}
            <main className="space-y-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20">
                            <BookOpen size={20} />
                        </div>
                        <Typography variant="h3" className="mb-0 italic tracking-tighter text-white">Active Curriculums_</Typography>
                    </div>
                    <Button variant="ghost" className="text-[10px] font-black italic uppercase tracking-[0.3em] text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
                        Expand All Nodes →
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="glass-panel rounded-[3rem] border-white/5 h-[500px] animate-pulse shadow-2xl" />
                            ))
                        ) : courses.length > 0 ? (
                            courses.map((course) => (
                                <motion.div
                                    key={course.id}
                                    variants={nodeVariants}
                                    layout
                                    whileHover={{ y: -15, scale: 1.02 }}
                                    onClick={() => navigate(`/lms/course/${course.id}`)}
                                    className="glass-panel rounded-[3rem] overflow-hidden flex flex-col group border-white/5 hover:border-[var(--color-primary)]/40 transition-all duration-500 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black/40 relative"
                                >
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#050510]">
                                        {course.image ? (
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1024] to-[#050510]">
                                                <Typography variant="h1" className="text-9xl text-white/[0.03] m-0 italic">{course.title.substring(0, 1)}</Typography>
                                                <PlayCircle className="absolute text-white/10 group-hover:text-[var(--color-primary)]/60 transition-all duration-500" size={64} strokeWidth={1} />
                                            </div>
                                        )}
                                        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-2xl px-4 py-2 rounded-2xl text-[var(--color-secondary)] text-[10px] font-black tracking-widest uppercase border border-[var(--color-secondary)]/30 italic shadow-xl">
                                            {course.level}
                                        </div>
                                    </div>

                                    <div className="p-10 flex-1 flex flex-col space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                            {course.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 px-3 py-1 rounded-xl uppercase tracking-wider italic">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h4 className="font-black text-2xl text-white leading-tight group-hover:text-[var(--color-secondary)] transition-colors italic tracking-tighter">
                                            {course.title}_
                                        </h4>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px] shadow-lg">
                                                <div className="w-full h-full rounded-[1.1rem] bg-black flex items-center justify-center text-[11px] font-black text-white italic">
                                                    {course.instructor.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Arch. {course.instructor}</p>
                                                <div className="flex items-center gap-2">
                                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-[10px] font-black text-white italic">{course.rating}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={14} className="text-[var(--color-primary)]" />
                                                <span className="text-[10px] font-black uppercase italic tracking-widest">{course.duration} Session</span>
                                            </div>
                                            <div className="text-2xl font-black text-white italic tracking-tighter">
                                                {course.isFree || (course.price && parseFloat(course.price) === 0) ? '00.00' : `${course.price || '99.99'}`}
                                                <span className="text-[10px] text-slate-600 ml-1">USD</span>
                                            </div>
                                        </div>

                                        <Button 
                                            variant="primary" 
                                            fullWidth 
                                            className="py-5 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] shadow-[0_10px_30px_rgba(140,37,244,0.3)] hover:shadow-[var(--color-secondary)]/20"
                                        >
                                            Synchronize_
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-40 flex flex-col items-center justify-center text-center glass-panel rounded-[3rem] border-white/5 border-dashed bg-black/20"
                            >
                                <div className="size-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                                    <Zap size={40} className="text-slate-800" />
                                </div>
                                <div className="space-y-4">
                                    <Typography variant="h2" className="text-white italic tracking-tighter m-0">Zero Affinity Detected_</Typography>
                                    <p className="text-slate-500 max-w-md mx-auto italic text-lg leading-relaxed">
                                        The neural query "{searchQuery}" returned zero valid knowledge nodes in {activeCategory}.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All Nodes'); }}
                                    variant="secondary"
                                    className="mt-12 px-12 py-5 scale-110 shadow-2xl"
                                >
                                    REINITIALIZE MATRIX SCAN
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Elite Contest Module - Synchronized Footer */}
            <motion.section variants={nodeVariants} className="relative p-12 glass-panel rounded-[4rem] border-[var(--color-primary)]/30 overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/15 via-transparent to-[var(--color-secondary)]/15 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <Typography variant="h2" className="text-white mb-0 italic tracking-tighter">Global Hack Protocol 350_</Typography>
                        <p className="text-slate-400 font-medium italic text-lg max-w-xl">
                            Elite synchronization event starts in <span className="text-[var(--color-secondary)] font-black">2d 14h</span>. Elevate your status to Arch-Tier.
                        </p>
                    </div>
                    <Button variant="primary" className="px-16 py-6 text-xs italic tracking-[0.3em] shadow-[0_0_40px_rgba(140,37,244,0.4)]">
                        ENROLL SEQUENCE_
                    </Button>
                </div>
            </motion.section>
        </motion.div>
    );
};
