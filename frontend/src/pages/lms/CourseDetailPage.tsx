import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Users, Star, ChevronDown, ChevronRight, 
    Play, Lock, BookOpen,
    ArrowLeft, ShieldCheck,
    Target, Zap, Brain, Rocket, Award
} from 'lucide-react';
import { useToast } from '../../components/organisms/Toast';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface Lesson {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    free: boolean;
}

interface Course {
    id: string;
    title: string;
    description: string;
    instructor: { name: string; role?: string; initials: string; rating: number; courses: number };
    duration: string;
    level: string;
    rating: number;
    enrolledCount: number;
    lessonCount: number;
    tags: string[];
    isFree: boolean;
    price: string;
    whatYoullLearn: string[];
    curriculum: { section: string; lessons: Lesson[] }[];
    progress: number;
    isEnrolled: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const CourseDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [course, setCourse] = useState<Course | null>(null);
    const [openSections, setOpenSections] = useState<number[]>([0]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/v1/courses/${id}`).catch(() => null);
                if (res?.data?.course) {
                    setCourse({
                        ...res.data.course,
                        instructor: res.data.course.instructor || { name: 'Dr. Sarah Chen', role: 'Arch. Neural Systems', initials: 'SC', rating: 4.9, courses: 12 },
                        whatYoullLearn: res.data.course.whatYoullLearn || ['Neural architecture patterns', 'High-fidelity state management', 'Global signal distribution', 'Encryption protocols'],
                        progress: res.data.course.progress || 0,
                    });
                }
            } catch (err) {
                console.error('Failed to fetch course detail', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    const toggleSection = (i: number) => {
        setOpenSections(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]);
    };

    const handleEnroll = async () => {
        setIsEnrolling(true);
        try {
            await api.post(`/api/v1/courses/${id}/enroll`);
            addToast({ type: 'success', title: 'Stream Synchronized', message: `You have successfully merged with "${course?.title}"` });
            setCourse(prev => prev ? { ...prev, isEnrolled: true } : null);
            const firstLessonId = course?.curriculum[0]?.lessons[0]?.id || 'l1';
            navigate(`/lms/course/${id}/lesson/${firstLessonId}`);
        } catch (err) {
            addToast({ type: 'error', title: 'Sync Failed', message: 'Neural link could not be established.' });
        } finally {
            setIsEnrolling(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="relative size-20">
                <div className="absolute inset-0 border-4 border-[#13ecec]/10 rounded-full animate-ping" />
                <div className="absolute inset-0 border-4 border-t-[#13ecec] border-transparent rounded-full animate-spin" />
            </div>
            <Typography variant="label" className="text-slate-500 italic uppercase tracking-[0.4em] text-[10px] font-black">Syncing Knowledge Node Bios_</Typography>
        </div>
    );
    
    if (!course) return (
        <div className="py-40 text-center">
            <Typography variant="h2" className="text-white italic tracking-tighter">Node Not Found_</Typography>
            <Button variant="secondary" className="mt-8 px-12" onClick={() => navigate('/courses')}>Return to Nexus</Button>
        </div>
    );

    const totalLessons = course.curriculum.reduce((acc, s) => acc + s.lessons.length, 0);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 px-4 sm:px-0"
        >
            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Back to Nexus */}
            <motion.button 
                variants={itemVariants}
                onClick={() => navigate('/courses')} 
                className="flex items-center gap-3 text-slate-500 hover:text-white transition-all group"
            >
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-[#13ecec]/30 transition-all">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Knowledge Nexus_</span>
            </motion.button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Core Knowledge Stream (8 cols) */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Hero Module */}
                    <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8c25f4]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="flex flex-wrap gap-3">
                                {course.tags.map(t => (
                                    <span key={t} className="px-4 py-1.5 bg-[#8c25f4]/15 border border-[#8c25f4]/30 text-[#8c25f4] text-[9px] font-black uppercase tracking-widest italic rounded-xl">{t}</span>
                                ))}
                                <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-[#13ecec] text-[9px] font-black uppercase tracking-widest italic rounded-xl">{course.level} Sequence</span>
                            </div>
                            
                            <div className="space-y-4">
                                <Typography variant="h1" className="text-white text-7xl tracking-tighter italic m-0 lg:leading-[0.9]">{course.title}_</Typography>
                                <p className="text-slate-400 text-xl font-medium italic leading-relaxed max-w-2xl opacity-90">{course.description}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <Star size={18} className="text-[#13ecec] fill-[#13ecec]/40" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black italic text-sm leading-none">{course.rating}</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Reliability Rank</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-[#8c25f4]" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black italic text-sm leading-none">{course.enrolledCount.toLocaleString()}</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Active Synchronizations</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-slate-500" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black italic text-sm leading-none">{course.duration}</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Temporal Duration</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Brain size={18} className="text-[#13ecec]" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black italic text-sm leading-none">{totalLessons} Nodes</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Architecture Depth</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Matrix Learning Objectives */}
                    <motion.section variants={itemVariants} className="glass-panel p-16 rounded-[3.5rem] border-white/5 bg-black/40 shadow-2xl space-y-12">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                            <div className="p-3 rounded-2xl bg-[#13ecec]/10 text-[#13ecec] border border-[#13ecec]/30 shadow-lg">
                                <Rocket size={28} />
                            </div>
                            <Typography variant="h2" className="m-0 italic tracking-tighter">Acquisition Targets_</Typography>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {course.whatYoullLearn.map((item, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#13ecec]/40 transition-all">
                                        <Target size={20} className="text-[#13ecec] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-400 italic leading-snug group-hover:text-white transition-colors">
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Neural Curriculum Matrix */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[3.5rem] border-white/10 overflow-hidden shadow-2xl bg-black/40">
                        <div className="p-12 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-br from-[#8c25f4]/10 to-transparent">
                            <div className="space-y-2 text-center md:text-left">
                                <Typography variant="h2" className="m-0 italic tracking-tighter">Neural Stream Architecture_</Typography>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Sequential Data Extraction Protocol</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                                    <span className="text-xl font-black text-white italic leading-none">{course.curriculum.length}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Sectors</span>
                                </div>
                                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                                    <span className="text-xl font-black text-[#13ecec] italic leading-none">{totalLessons}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Nodes</span>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-white/5">
                            {course.curriculum.map((section, i) => (
                                <div key={i} className="group">
                                    <button 
                                        onClick={() => toggleSection(i)} 
                                        className="w-full flex items-center justify-between p-10 hover:bg-white/5 transition-all text-left outline-none group"
                                    >
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black text-white italic tracking-tighter group-hover:text-[#13ecec] transition-colors">{section.section}_</p>
                                            <div className="flex items-center gap-3">
                                                <div className="size-1.5 bg-[#8c25f4] rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{section.lessons.length} Core Nodes</span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-full transition-all duration-500 border shadow-2xl",
                                            openSections.includes(i) ? "bg-[#8c25f4]/20 border-[#8c25f4]/40 text-[#8c25f4] rotate-180" : "bg-white/5 border-white/5 text-slate-600 group-hover:text-white"
                                        )}>
                                            <ChevronDown size={24} />
                                        </div>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {openSections.includes(i) && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-10 pb-10 space-y-4 overflow-hidden"
                                            >
                                                {section.lessons.map((lesson, idx) => (
                                                    <div 
                                                        key={lesson.id} 
                                                        onClick={() => (lesson.free || course.isEnrolled) && navigate(`/lms/course/${id}/lesson/${lesson.id}`)} 
                                                        className={cn(
                                                            "flex items-center gap-8 p-6 rounded-[2rem] border-2 transition-all duration-300 relative group/lesson",
                                                            (lesson.free || course.isEnrolled) 
                                                                ? "cursor-pointer bg-black/40 border-white/5 hover:border-[#13ecec]/40 hover:bg-[#13ecec]/05 shadow-xl hover:shadow-[#13ecec]/10" 
                                                                : "cursor-default bg-white/05 border-transparent opacity-40 grayscale"
                                                        )}
                                                    >
                                                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover/lesson:border-[#13ecec]/40 transition-colors">
                                                            <span className="text-xs font-black text-slate-500 group-hover/lesson:text-white transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <p className={cn("text-xl font-black italic tracking-tighter truncate", (lesson.free || course.isEnrolled) ? "text-white group-hover/lesson:text-[#13ecec]" : "text-slate-600")}>{lesson.title}_</p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{lesson.duration} Sequential Flow</span>
                                                                {lesson.free && !course.isEnrolled && (
                                                                    <span className="bg-[#13ecec]/15 text-[#13ecec] px-3 py-1 rounded-lg border border-[#13ecec]/30 text-[9px] font-black uppercase italic tracking-widest shadow-lg">Open Node</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="shrink-0">
                                                            {(lesson.free || course.isEnrolled) ? (
                                                                <div className="size-14 rounded-full bg-[#13ecec]/20 flex items-center justify-center text-[#13ecec] group-hover/lesson:bg-[#13ecec] group-hover/lesson:text-black transition-all duration-500 shadow-2xl">
                                                                    <Play size={24} className="ml-1 fill-current" />
                                                                </div>
                                                            ) : (
                                                                <div className="size-14 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                                                                    <Lock size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>

                {/* Acquisition Control (4 cols) */}
                <div className="lg:col-span-4 space-y-12">
                    <motion.section variants={itemVariants} className="sticky top-24">
                        <div className="glass-panel rounded-[3.5rem] border-[#13ecec]/40 shadow-[0_30px_60px_-15px_rgba(19,236,236,0.15)] relative overflow-hidden bg-black/60 backdrop-blur-3xl group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#13ecec]/10 via-transparent to-transparent pointer-events-none" />
                            
                            <div className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer" onClick={() => !course.isEnrolled && handleEnroll()}>
                                <motion.div 
                                    className="w-full h-full bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent z-10" />
                                <div className="absolute inset-0 z-20 flex items-center justify-center">
                                    <div className="size-20 rounded-full bg-[#13ecec]/90 text-black flex items-center justify-center shadow-[0_0_40px_rgba(19,236,236,0.8)] backdrop-blur-sm group-hover:scale-110 transition-transform">
                                        <Play size={32} className="ml-1 fill-current" />
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
                                    <span className="text-[9px] font-black text-white uppercase tracking-[0.4em] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-3xl italic">Preview Matrix Stream_</span>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4">
                                        <Typography variant="h1" className="text-white text-6xl tracking-tighter italic m-0">{course.isFree ? 'FREE' : `$${course.price || '89.99'}`}</Typography>
                                        {!course.isFree && <span className="text-xl font-black text-slate-700 line-through italic mb-2">$149.99</span>}
                                    </div>
                                    <p className="text-[10px] font-black text-[#13ecec] uppercase tracking-widest italic animate-pulse">Neural Value Acquisition Active</p>
                                </div>
                                
                                <div className="space-y-4">
                                    {course.isEnrolled ? (
                                        <Button 
                                            onClick={() => navigate(`/lms/course/${id}/lesson/${course.curriculum[0]?.lessons[0]?.id || 'l1'}`)} 
                                            fullWidth 
                                            size="lg" 
                                            className="h-24 rounded-[2rem] text-[12px] font-black italic shadow-[0_15px_30px_rgba(140,37,244,0.3)] group"
                                        >
                                            <span className="flex items-center gap-3">CONTINUE SYNC <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
                                        </Button>
                                    ) : (
                                        <Button 
                                            disabled={isEnrolling} 
                                            onClick={handleEnroll} 
                                            fullWidth 
                                            size="lg" 
                                            className="h-24 rounded-[2rem] text-[12px] font-black italic shadow-[0_20px_40px_rgba(19,236,236,0.3)] disabled:opacity-50"
                                        >
                                            {isEnrolling ? (
                                                <div className="size-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-3">{course.isFree ? 'INITIALIZE SYNC' : 'ACQUIRE KNOWLEDGE_'} <Zap size={20} className="animate-pulse" /></span>
                                            )}
                                        </Button>
                                    )}
                                    <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest italic">30-Day Persistence Guarantee_</p>
                                </div>
                                
                                <div className="space-y-6 pt-10 border-t border-white/5">
                                    <Typography variant="label" className="text-slate-400 uppercase tracking-widest text-[9px] font-black italic">Stream Specifications:</Typography>
                                    <div className="space-y-4">
                                        {[
                                            { icon: Play, text: `${course.duration} On-Demand Stream`, color: '#8c25f4' },
                                            { icon: BookOpen, text: `${totalLessons} Integrated Nodes`, color: '#13ecec' },
                                            { icon: Award, text: 'Persistence Certificate', color: '#fbbf24' },
                                            { icon: ShieldCheck, text: 'LIFETIME MESH ACCESS', color: '#10b981' }
                                        ].map((spec, i) => (
                                            <div key={i} className="flex items-center gap-4 group/spec">
                                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/spec:border-white/10 transition-colors">
                                                    <spec.icon size={18} style={{ color: spec.color }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic group-hover/spec:text-white transition-colors">{spec.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructor Node */}
                        <div className="mt-12 glass-panel p-10 rounded-[3rem] border-white/5 bg-black/40 shadow-2xl space-y-8">
                             <Typography variant="label" className="text-slate-600 uppercase tracking-widest text-[9px] font-black italic">Architect_</Typography>
                             <div className="flex items-center gap-6">
                                <div className="size-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-[#8c25f4] p-[2px] shadow-2xl relative">
                                    <div className="w-full h-full bg-slate-900 rounded-[1.4rem] flex items-center justify-center text-2xl font-black text-white italic">
                                        {course.instructor.initials}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 size-5 bg-[#13ecec] rounded-lg border-2 border-slate-950 shadow-lg" />
                                </div>
                                <div className="space-y-1">
                                    <Typography variant="h3" className="text-white m-0 italic tracking-tighter">{course.instructor.name}_</Typography>
                                    <p className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic leading-none">{course.instructor.role}</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <span className="block text-lg font-black text-[#13ecec] italic leading-none">{course.instructor.rating}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Reliability</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <span className="block text-lg font-black text-white italic leading-none">{course.instructor.courses}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Streams</span>
                                </div>
                             </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
};
