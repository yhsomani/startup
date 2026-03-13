import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Play, RotateCcw, Send,
    Clock, Cpu, Trophy, Share2, Settings, Terminal, Map, Users, User, ArrowLeft,
    ChevronDown
} from 'lucide-react';
import { CodeEditor, SUPPORTED_LANGUAGES } from '../../components/organisms/CodeEditor';
import { useToast } from '../../components/organisms/Toast';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface Challenge {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string[];
    tags: string[];
    starterCode: Record<string, string>;
}

interface TestResult {
    id: number;
    input: string;
    expected: string;
    passed: boolean | null;
    output: string;
    time: string;
}

const difficultyVariant: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export const CodeEditorPage: React.FC = () => {
    const { id: challengeId } = useParams();
    const { addToast } = useToast();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [language, setLanguage] = useState<string>('javascript');
    const [code, setCode] = useState('');
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [activeCase, setActiveCase] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePanel, setActivePanel] = useState<'challenge' | 'hub'>('challenge');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/v1/challenges/${challengeId}`);
                if (res.data?.challenge) {
                    setChallenge(res.data.challenge);
                    setCode(res.data.challenge.starterCode[language] || '');
                    setTestResults(res.data.challenge.examples.map((ex: any, i: number) => ({
                        id: i + 1,
                        input: ex.input,
                        expected: ex.output,
                        passed: null,
                        output: '',
                        time: ''
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch challenge', err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [challengeId, language]);

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        if (challenge) {
            setCode(challenge.starterCode[lang] || `// ${lang} solution`);
        }
    };

    const runTests = async () => {
        setIsRunning(true);
        try {
            const res = await api.post('/api/v1/challenges/execute', {
                challengeId,
                language,
                code
            });
            if (res.data?.passed) {
                setTestResults(prev => prev.map(tr => ({ ...tr, passed: true, output: tr.expected, time: '120ms' })));
                addToast({ type: 'success', title: 'Code Ran Successfully', message: 'Compilation and initial tests passed.' });
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Execution Error', message: 'Failed to run code.' });
        } finally {
            setIsRunning(false);
        }
    };

    const submitCode = async () => {
        setIsSubmitting(true);
        try {
            const res = await api.post(`/api/v1/challenges/${challengeId}/submit`, {
                language,
                code
            });
            if (res.data?.passed) {
                addToast({ type: 'success', title: '🎉 Accepted!', message: `All test cases passed. +${res.data.xpEarned} XP earned!` });
                setTestResults(prev => prev.map(tr => ({ ...tr, passed: true, output: tr.expected, time: '45ms' })));
            } else {
                addToast({ type: 'error', title: 'Wrong Answer', message: 'Some test cases failed. Keep trying!' });
                setTestResults(prev => prev.map(tr => ({ ...tr, passed: false, output: 'Incorrect output', time: '40ms' })));
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Submission Error', message: 'Failed to submit code.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#0a070d]"><div className="w-12 h-12 border-4 border-[#8c25f4]/30 border-t-[#8c25f4] rounded-full animate-spin"></div></div>;
    if (!challenge) return <div className="p-8 text-center bg-[#0a070d] h-screen text-white">Challenge not found</div>;

    return (
        <div className="bg-[#0a070d] font-sans text-slate-100 overflow-hidden h-screen flex flex-col fixed inset-0 z-50">
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#8c25f4]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#13ecec]/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Top Navigation Header */}
            <header className="flex items-center bg-black/40 backdrop-blur-xl p-6 border-b border-white/10 justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <Link to="/challenges" className="text-slate-400 hover:text-[#13ecec] transition-colors flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#13ecec]/30">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Exit Workspace</span>
                    </Link>
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                    <h1 className="text-white text-xl font-black leading-tight tracking-tighter italic hidden sm:block">Arena_IDE_</h1>
                </div>

                <div className="flex gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl">
                    <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-[#8c25f4] text-white shadow-[0_0_20px_rgba(140,37,244,0.3)] italic">Logic Matrix</button>
                    <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/5 italic">Community Sync</button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#8c25f4]/10 rounded-xl border border-[#8c25f4]/20 hidden md:flex">
                        <Trophy size={16} className="text-[#8c25f4]" />
                        <span className="text-[10px] font-black text-white italic">240 XP_AVAILABLE</span>
                    </div>
                    <Share2 size={20} className="text-slate-500 cursor-pointer hover:text-[#13ecec] transition-colors" />
                </div>
            </header>

            {/* Main Content Split Pane */}
            <main className="flex-1 overflow-hidden flex flex-col lg:flex-row pb-24 lg:pb-0">
                {/* Left Pane: Challenge Info */}
                <section className="w-full lg:w-5/12 xl:w-[45%] flex flex-col min-h-0 bg-[#0a070d]/60 backdrop-blur-3xl border-r border-white/5 overflow-y-auto custom-scrollbar">
                    <div className="p-10 space-y-10">
                        <div className="flex border-b border-white/10 gap-10">
                            <button 
                                onClick={() => setActivePanel('challenge')}
                                className={cn("flex flex-col items-center justify-center border-b-2 pb-5 pt-2 transition-all relative group", activePanel === 'challenge' ? "border-[#8c25f4] text-white" : "border-transparent text-slate-600 hover:text-slate-300")}
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Knowledge Signal</p>
                                {activePanel === 'challenge' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#13ecec] blur-sm animate-pulse" />}
                            </button>
                            <button 
                                onClick={() => setActivePanel('hub')}
                                className={cn("flex flex-col items-center justify-center border-b-2 pb-5 pt-2 transition-all relative group", activePanel === 'hub' ? "border-[#8c25f4] text-white" : "border-transparent text-slate-600 hover:text-slate-300")}
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Neural Hints</p>
                                {activePanel === 'hub' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#13ecec] blur-sm animate-pulse" />}
                            </button>
                        </div>

                        {activePanel === 'challenge' ? (
                            <div className="space-y-10">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">{challenge.title}_</h2>
                                    <span className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl skew-x-[-12deg]", difficultyVariant[challenge.difficulty])}>
                                        {challenge.difficulty}
                                    </span>
                                </div>

                                <div className="prose prose-sm prose-invert max-w-none text-slate-400 leading-relaxed italic text-[15px] font-medium space-y-6">
                                    {challenge.description.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                <div className="glass-panel rounded-3xl p-8 space-y-5 border-white/5 bg-black/20">
                                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-4">Attribute Tags</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {challenge.tags.map(t => (
                                            <span key={t} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase italic tracking-widest">{t}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-6">Execution Examples</h4>
                                    {challenge.examples.map((ex, i) => (
                                        <div key={i} className="flex flex-col p-8 glass-panel border-white/5 rounded-[2.5rem] space-y-5 relative overflow-hidden group bg-black/20 hover:border-[#13ecec]/20 transition-all">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8c25f4]/30 group-hover:bg-[#13ecec] transition-all" />
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-widest italic">Signal Example {i + 1}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[8px] text-slate-700 font-black uppercase tracking-widest block mb-2 italic">Input Matrix:</span>
                                                    <div className="font-mono text-xs text-slate-300 bg-black/40 p-4 rounded-2xl border border-white/5">{ex.input}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] text-slate-700 font-black uppercase tracking-widest block mb-2 italic">Target Output:</span>
                                                    <div className="font-mono text-xs text-emerald-400 bg-emerald-400/5 p-4 rounded-2xl border border-emerald-400/20">
                                                        {ex.output}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic">System Constraints</h4>
                                <ul className="space-y-4 p-8 glass-panel rounded-[2.5rem] border-white/5 bg-black/20">
                                    {challenge.constraints.map((c, i) => (
                                        <li key={i} className="text-[13px] text-slate-400 font-mono italic flex gap-4"><span className="text-[#8c25f4]">•</span> {c}</li>
                                    ))}
                                </ul>
                                <div className="p-8 bg-[#13ecec]/5 border border-[#13ecec]/20 rounded-[2.5rem] flex items-start gap-4">
                                    <Cpu size={24} className="text-[#13ecec] shrink-0" />
                                    <p className="text-[13px] text-slate-300 italic leading-relaxed">Neural analysis suggests an O(n) optimization path for maximum cognitive efficiency.</p>
                                </div>
                            </div>
                        )}
                        <div className="h-40"></div>
                    </div>
                </section>

                {/* Right Pane: Arena IDE */}
                <section className="flex-1 flex flex-col bg-[#0d0a14] min-h-[400px] border-t lg:border-t-0 border-white/5 relative">
                    <div className="flex items-center justify-between bg-black/40 px-8 py-4 border-b border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <select
                                    value={language}
                                    onChange={e => handleLanguageChange(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-xl px-5 py-2 text-[10px] font-black text-[#13ecec] outline-none cursor-pointer appearance-none uppercase tracking-[0.2em] italic hover:border-[#13ecec]/30 transition-all pr-12"
                                >
                                    {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-[#13ecec]">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                            <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest italic">source_matrix.{language === 'javascript' || language === 'typescript' ? 'js' : language === 'python' ? 'py' : language}</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => setCode(challenge.starterCode[language] || '')} className="text-slate-600 hover:text-[#8c25f4] transition-all p-2 rounded-lg hover:bg-[#8c25f4]/10" title="Reset Code"><RotateCcw size={18} /></button>
                            <button className="text-slate-600 hover:text-[#13ecec] transition-all p-2 rounded-lg hover:bg-[#13ecec]/10" title="IDE Settings"><Settings size={18} /></button>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <CodeEditor
                            language={language}
                            value={code}
                            onChange={setCode}
                            theme="vs-dark"
                            height="100%"
                            className="absolute inset-0 border-none rounded-none"
                        />
                    </div>

                    {/* Verification Terminal */}
                    {testResults.length > 0 && (
                        <div className="h-64 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
                            <div className="flex items-center gap-3 px-8 py-3 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
                                {testResults.map((tc, i) => (
                                    <button 
                                        key={tc.id} 
                                        onClick={() => setActiveCase(i)}
                                        className={cn(
                                            "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic border flex items-center gap-2", 
                                            activeCase === i 
                                                ? "bg-[#8c25f4]/20 text-white border-[#8c25f4]/40 shadow-[0_0_15px_rgba(140,37,244,0.2)]" 
                                                : "bg-black/40 border-white/5 text-slate-600 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        {tc.passed === true && <div className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />}
                                        {tc.passed === false && <div className="size-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />}
                                        Signal Node {tc.id}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/40">
                                {testResults[activeCase] && (
                                    <div className="space-y-6 font-mono text-[13px] animate-in fade-in duration-300">
                                        <div>
                                            <span className="text-slate-600 block mb-3 uppercase text-[9px] font-black font-sans tracking-[0.2em] italic">Transmission Input:</span>
                                            <div className="text-slate-300 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">{testResults[activeCase].input}</div>
                                        </div>
                                        {testResults[activeCase].output && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <span className="text-slate-600 block mb-3 uppercase text-[9px] font-black font-sans tracking-[0.2em] italic">Actual Pulse:</span>
                                                    <div className={cn("p-5 rounded-2xl border", testResults[activeCase].passed ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" : "text-rose-400 bg-rose-400/5 border-rose-400/20")}>
                                                        {testResults[activeCase].output}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600 block mb-3 uppercase text-[9px] font-black font-sans tracking-[0.2em] italic">Desired Signature:</span>
                                                    <div className="text-white bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl">{testResults[activeCase].expected}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-8 pt-6 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">
                                            <span className="flex items-center gap-2"><Clock size={12} className="text-[#8c25f4]" /> LATENCY: {testResults[activeCase].time || '0ms'}</span>
                                            <span className="flex items-center gap-2"><Cpu size={12} className="text-[#13ecec]" /> NEURAL LOAD: 18.2 MB</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* Neural Control Bar */}
            <div className="fixed bottom-24 lg:bottom-10 left-10 right-10 flex justify-center z-50 pointer-events-none">
                <div className="max-w-4xl w-full bg-black/60 backdrop-blur-3xl p-5 rounded-[2.5rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-auto">
                    <div className="flex items-center gap-5 ml-6">
                        <div className="relative">
                            <div className="size-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]"></div>
                            <div className="absolute inset-0 size-3 rounded-full bg-emerald-400 blur-sm animate-ping opacity-30"></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{isSubmitting ? 'TRANSMITTING...' : isRunning ? 'REFINING...' : 'READY FOR SYNC'}</span>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            disabled={isRunning || isSubmitting}
                            onClick={runTests}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#13ecec] font-black text-[10px] py-4 px-10 rounded-2xl border border-white/5 hover:border-[#13ecec]/30 transition-all flex items-center gap-3 uppercase tracking-widest italic"
                        >
                            <Play size={16} className="fill-current text-[#13ecec]" />
                            <span>Run Scan</span>
                        </button>
                        <button 
                            disabled={isRunning || isSubmitting}
                            onClick={submitCode}
                            className="bg-gradient-to-r from-[#8c25f4] to-purple-600 hover:to-[#8c25f4] active:scale-95 text-white font-black text-[10px] py-4 px-12 rounded-2xl shadow-[0_0_30px_rgba(140,37,244,0.4)] hover:shadow-[0_0_40px_rgba(140,37,244,0.6)] transition-all flex items-center gap-3 uppercase tracking-widest italic"
                        >
                            <Send size={16} className="text-white" />
                            <span>Commit Matrix</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Terminal Nav (Mobile only) */}
            <nav className="lg:hidden fixed bottom-0 w-full border-t border-white/10 bg-black/95 backdrop-blur-2xl px-10 py-5 pb-safe flex justify-between items-center z-50 shadow-2xl">
                <Link to="/courses" className="flex flex-col items-center gap-2 text-slate-600 font-black p-1 transition-all">
                    <Map size={24} />
                    <p className="text-[8px] uppercase tracking-[0.2em] italic">Nexus</p>
                </Link>
                <Link to="/challenges" className="flex flex-col items-center gap-2 text-[#13ecec] font-black p-1">
                    <Terminal size={24} />
                    <p className="text-[8px] uppercase tracking-[0.2em] italic">Arena</p>
                </Link>
                <Link to="/network" className="flex flex-col items-center gap-2 text-slate-600 font-black p-1">
                    <Users size={24} />
                    <p className="text-[8px] uppercase tracking-[0.2em] italic">Mesh</p>
                </Link>
                <Link to="/profile" className="flex flex-col items-center gap-2 text-slate-600 font-black p-1">
                    <User size={24} />
                    <p className="text-[8px] uppercase tracking-[0.2em] italic">Identity</p>
                </Link>
            </nav>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1523; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8c25f4; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes orbit-slow {
                    from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
                }
            `}</style>
        </div>
    );
};

