import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Play, Pause, Volume2, VolumeX, Maximize, Settings,
    ArrowLeft, Share2, MoreVertical, SkipBack, SkipForward,
    Activity, Zap, ChevronRight, Download
} from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { Typography } from '../../components/atoms/Typography';
import { Button } from '../../components/atoms/Button';

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
    curriculum: { section: string; lessons: Lesson[] }[];
}

export const VideoPlayerPage: React.FC = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'notes' | 'qa' | 'resources'>('curriculum');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/v1/courses/${courseId}`).catch(() => null);
                if (res?.data?.course) {
                    setCourse(res.data.course);
                }
            } catch (err) {
                console.error('Failed to fetch neural stream data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const allLessons = course?.curriculum.flatMap(s => s.lessons) || [];
    const currentLesson = allLessons.find(l => l.id === lessonId) || allLessons[0];
    const currentIdx = allLessons.indexOf(currentLesson);
    const prevLesson = allLessons[currentIdx - 1];
    const nextLesson = allLessons[currentIdx + 1];

    const completedCount = allLessons.filter(l => l.completed).length;
    const totalCount = allLessons.length;

    const syncProgress = async () => {
        if (!courseId || !lessonId) return;
        try {
            await api.put('/api/v1/lms/progress', {
                courseId,
                lessonId,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Failed to sync neural progress', err);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(syncProgress, 30000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, courseId, lessonId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050510] space-y-8">
            <div className="relative size-20">
                <div className="absolute inset-0 border-4 border-[var(--color-primary)]/10 rounded-full animate-ping" />
                <div className="absolute inset-0 border-4 border-t-[var(--color-primary)] border-transparent rounded-full animate-spin" />
            </div>
            <Typography variant="label" className="text-slate-600 italic uppercase tracking-[0.4em] text-[10px] font-black">Initializing Neural Stream_</Typography>
        </div>
    );

    if (!currentLesson) return (
        <div className="p-8 text-center bg-[#050510] min-h-screen flex flex-col items-center justify-center space-y-8">
            <Typography variant="h2" className="text-white italic tracking-tighter">Null Stream Detected_</Typography>
            <Button variant="secondary" onClick={() => navigate('/courses')}>Return to Nexus</Button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050510] text-slate-100 font-sans fixed inset-0 z-50">
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-[var(--color-primary)]/05 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-[var(--color-secondary)]/05 blur-[120px] rounded-full" />
            </div>

            {/* Neural Player Header */}
            <header className="relative z-50 flex items-center justify-between px-8 py-6 bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(`/lms/course/${courseId}`)} 
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-[var(--color-secondary)]/30 transition-all hover:scale-110 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="hidden lg:flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic leading-none mb-2">Neural Stream Player v2.4</span>
                        <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">{course?.title}_</h1>
                    </div>
                </div>

                <div className="flex-1 flex justify-center px-10 overflow-hidden hidden md:flex">
                    <div className="px-6 py-2.5 rounded-2xl bg-white/05 border border-white/05 backdrop-blur-3xl flex items-center gap-4">
                        <Activity size={14} className="text-[var(--color-secondary)] animate-pulse" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic truncate max-w-md">
                            {currentLesson.title}_
                        </span>
                        <div className="size-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end mr-4">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Sync Progress</span>
                        <span className="text-sm font-black text-[var(--color-secondary)] italic leading-none">{Math.round((completedCount / totalCount) * 100)}%</span>
                    </div>
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                        <Share2 size={20} />
                    </button>
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Immersive Stream Frame */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-black/40">
                    <section className="p-8 pb-4">
                        <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-black shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 group">
                            {/* Neural Background Trace */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                className="absolute inset-0 bg-cover bg-center grayscale mix-blend-screen group-hover:scale-105 transition-transform duration-[20s] linear" 
                                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80')" }}
                            />
                            
                            {/* Central Sync Core */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 group-hover:bg-black/30 transition-colors">
                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsPlaying(!isPlaying)} 
                                    className="size-28 rounded-full bg-[var(--color-secondary)]/90 text-black flex items-center justify-center shadow-[0_0_60px_rgba(19,236,236,0.6)] backdrop-blur-md transition-all hover:bg-[var(--color-secondary)]"
                                >
                                    {isPlaying ? <Pause size={48} className="fill-current" /> : <Play size={48} className="ml-2 fill-current" />}
                                </motion.button>
                            </div>
                            
                            {/* Neural Interface Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/60 to-transparent z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                <div className="space-y-8">
                                    {/* Progressive Trace */}
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1 h-3 bg-white/5 rounded-full relative overflow-hidden cursor-pointer group/progress shadow-inner">
                                            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full shadow-[0_0_20px_var(--color-secondary)]" />
                                            <div className="absolute left-1/3 -ml-2 top-1/2 -translate-y-1/2 size-4 bg-white rounded-full shadow-[0_0_15px_#fff] scale-0 group-hover/progress:scale-100 transition-transform" />
                                        </div>
                                        <span className="text-[11px] font-black text-white italic tracking-widest whitespace-nowrap">42:12 / {currentLesson.duration}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <button disabled={!prevLesson} onClick={() => navigate(`/lms/course/${courseId}/lesson/${prevLesson?.id}`)} className="text-white hover:text-[var(--color-secondary)] transition-all disabled:opacity-20 hover:scale-125">
                                                <SkipBack size={24} className="fill-current" />
                                            </button>
                                            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-[var(--color-secondary)] transition-all hover:scale-125">
                                                {isPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current" />}
                                            </button>
                                            <button disabled={!nextLesson} onClick={() => navigate(`/lms/course/${courseId}/lesson/${nextLesson?.id}`)} className="text-white hover:text-[var(--color-secondary)] transition-all disabled:opacity-20 hover:scale-125">
                                                <SkipForward size={24} className="fill-current" />
                                            </button>
                                            <div className="w-[1px] h-8 bg-white/10 mx-2" />
                                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-[var(--color-secondary)] transition-all hover:scale-125">
                                                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-8">
                                            <button className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black text-white italic border border-white/10 hover:border-[var(--color-secondary)]/40 transition-all">1.25x SPEED</button>
                                            <button className="text-white hover:text-[var(--color-secondary)] transition-all hover:rotate-90"><Settings size={24} /></button>
                                            <button className="text-white hover:text-[var(--color-secondary)] transition-all hover:scale-125"><Maximize size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Metadata Node */}
                    <section className="px-12 py-8 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 rounded-lg text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest italic">Sector 0{currentIdx + 1}</span>
                            <span className="text-slate-700 font-bold">•</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Extraction Active</span>
                        </div>
                        <Typography variant="h2" className="text-white text-4xl italic tracking-tighter m-0">{currentLesson.title}_</Typography>
                        <p className="text-slate-400 font-medium italic text-lg max-w-3xl opacity-80 leading-relaxed">
                            Synchronizing neural pathways for deep comprehension. This node covers core architectural constraints and global state synchronization patterns.
                        </p>
                    </section>
                </div>

                {/* Vertical Matrix Controller (Curriculum/Notes) */}
                <div className="w-full lg:w-[450px] flex-shrink-0 border-l border-white/5 bg-black/60 backdrop-blur-3xl flex flex-col hidden lg:flex relative z-10 shadow-2xl">
                    {/* Header Metrics */}
                    <div className="p-10 border-b border-white/5 space-y-8 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-white italic tracking-tighter">Stream Progress_</h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Node Accumulation Rank</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-[var(--color-secondary)] italic leading-none">{completedCount}</span>
                                <span className="text-slate-600 font-bold mx-1">/</span>
                                <span className="text-sm font-black text-slate-500 italic">{totalCount}</span>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full shadow-[0_0_15px_rgba(19,236,236,0.3)]" 
                            />
                        </div>
                    </div>

                    {/* Matrix Tabs */}
                    <div className="flex border-b border-white/5 bg-black/20">
                        {(['curriculum', 'notes', 'resources'] as const).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all border-b-2",
                                    activeTab === tab 
                                        ? "text-[var(--color-secondary)] border-[var(--color-secondary)] bg-[var(--color-secondary)]/05" 
                                        : "text-slate-600 border-transparent hover:text-slate-300 hover:bg-white/02"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Vector Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {activeTab === 'curriculum' && course?.curriculum.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-4">
                                <div className="flex items-center gap-3 py-2 sticky top-0 bg-[#050510] z-20 px-4 mt-2">
                                    <div className="size-1.5 bg-[var(--color-primary)] rounded-full" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{section.section}</span>
                                </div>
                                
                                {section.lessons.map((lesson, lIdx) => (
                                    <motion.div
                                        key={lesson.id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => navigate(`/lms/course/${courseId}/lesson/${lesson.id}`)}
                                        className={cn(
                                            "rounded-[1.5rem] p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 border",
                                            lesson.id === lessonId 
                                                ? "bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/30 shadow-[0_0_20px_rgba(19,236,236,0.1)]" 
                                                : "bg-white/02 border-white/05 hover:border-white/10 hover:bg-white/05"
                                        )}
                                    >
                                        <div className="shrink-0">
                                            {lesson.completed ? (
                                                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                                                    <CheckCircle size={18} className="text-emerald-400" />
                                                </div>
                                            ) : lesson.id === lessonId ? (
                                                <div className="size-10 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center shadow-[0_0_15px_var(--color-secondary)]">
                                                    <Zap size={18} className="text-black" />
                                                </div>
                                            ) : (
                                                <div className="size-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/05 text-[10px] font-black text-slate-700 italic">
                                                    {String(lIdx + 1).padStart(2, '0')}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className={cn("text-sm font-black italic tracking-tight truncate", lesson.id === lessonId ? "text-white" : "text-slate-400")}>{lesson.title}_</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{lesson.duration} Sequence</p>
                                        </div>
                                        
                                        {lesson.id === lessonId && (
                                            <div className="size-2 bg-[var(--color-secondary)] rounded-full animate-ping" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ))}

                        {activeTab === 'notes' && (
                            <div className="space-y-6 pt-4 px-2">
                                <div className="space-y-4">
                                    <Typography variant="label" className="text-slate-600 uppercase tracking-widest text-[9px] font-black italic">Active Buffer_</Typography>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-3xl p-8 text-white text-sm font-medium italic focus:outline-none focus:border-[var(--color-secondary)]/40 transition-all min-h-[350px] resize-none placeholder:text-slate-800 shadow-inner"
                                        placeholder="Synchronize your insights... Persistence guaranteed."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                    <Button fullWidth className="h-16 rounded-2xl text-[11px] font-black italic uppercase tracking-[0.2em] shadow-xl">
                                        PUSH TO KNOWLEDGE GRAPH
                                    </Button>
                                </div>
                                
                                <div className="pt-10 border-t border-white/5 space-y-6">
                                    <Typography variant="label" className="text-slate-700 uppercase tracking-widest text-[8px] font-black">HISTORICAL PERSISTENCE</Typography>
                                    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/20 opacity-40 hover:opacity-100 transition-opacity space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-[var(--color-primary)] italic tracking-tighter">@ 04:20 MARK_</span>
                                            <span className="text-[8px] font-black text-slate-700">COORD: AX-402</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium italic italic">Encapsulate all side-effects within local controllers to ensure deterministic rendering flow.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'resources' && (
                            <div className="space-y-4 pt-4">
                                {['Structural Architecture.pdf', 'Node Schematics.zip', 'Logic Protocol.tsx'].map(r => (
                                    <motion.div 
                                        key={r} 
                                        whileHover={{ scale: 1.02, borderLeftColor: 'var(--color-secondary)' }}
                                        className="glass-panel p-6 rounded-3xl border-white/5 border-l-4 border-l-transparent bg-black/40 hover:bg-white/05 cursor-pointer transition-all flex items-center justify-between group shadow-xl"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-[var(--color-secondary)] group-hover:bg-[var(--color-secondary)]/10 transition-all">
                                                <Download size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm font-black text-white italic tracking-tighter block">{r}_</span>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Encrypted Payload</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-800 group-hover:text-[var(--color-secondary)] transition-all" />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(19, 236, 236, 0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(19, 236, 236, 0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
