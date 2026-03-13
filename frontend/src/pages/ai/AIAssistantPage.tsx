import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, Paperclip, Code2, Sparkles, MessageSquare, 
    History, FileText, Briefcase, Zap, Bot, User, 
    Copy, Check, Activity, ShieldCheck,
    Terminal, Cpu, Globe
} from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isCode?: boolean;
    language?: string;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: "Neural Nucleus online. I am your TalentSphere AI Synthesis Engine. How shall we optimize your trajectory today?"
    }
];

const SUGGESTIONS = [
    { icon: FileText, text: 'Neural Resume Optimization: React' },
    { icon: Zap, text: 'System Design Synapse Sync' },
    { icon: Briefcase, text: 'Trace Global Remote Hubs' },
    { icon: Code2, text: 'Review Protocol Signature' },
];

const PREVIOUS_CHATS = [
    "Frontend Matrix Architecture",
    "Negotiating Yield Strategy",
    "Resume Tailoring: Neural Hub",
    "Tier 1 Interview Prep",
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } }
};

export const AIAssistantPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Transmission received. Analysis complete. I've optimized your request parameters for maximum affinity.",
            };
            
            if (newUserMsg.content.toLowerCase().includes('code')) {
                aiResponse.content = "Protocol identified. Generating optimized implementation signature:";
                aiResponse.isCode = true;
                aiResponse.language = "typescript";
                
                const codeSnippet: Message = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    isCode: true,
                    language: 'typescript',
                    content: `function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}`
                };
                setMessages(prev => [...prev, aiResponse, codeSnippet]);
            } else {
                setMessages(prev => [...prev, aiResponse]);
            }
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend();
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex h-[calc(100vh-100px)] gap-8 p-1 relative"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[#13ecec]/05 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Sidebar Command Center */}
            <motion.aside 
                variants={itemVariants}
                className="hidden lg:flex w-96 flex-col glass-panel border-white/10 rounded-[3rem] bg-black/40 backdrop-blur-2xl p-10 overflow-hidden relative shadow-2xl"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8c25f4]/30 to-transparent" />
                
                <div className="flex-1 space-y-12 overflow-y-auto no-scrollbar">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="size-3 rounded-full bg-[#13ecec] shadow-[0_0_10px_#13ecec]" />
                            <h2 className="text-white text-3xl font-black italic tracking-tighter">Oracle Hub_</h2>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none ml-7">Tier 1 Neural Link Active</p>
                    </div>

                    <Button 
                        variant="ghost" 
                        fullWidth 
                        className="h-16 rounded-[1.5rem] bg-[#8c25f4]/5 border-[#8c25f4]/20 text-white text-xs font-black italic uppercase tracking-widest hover:bg-[#8c25f4]/10 transition-all flex items-center justify-center gap-3"
                    >
                        <MessageSquare size={16} /> INITIALIZE NEW SYNC
                    </Button>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 italic flex items-center gap-3">
                            <History size={14} className="text-[#8c25f4]" /> Synapse History
                        </h3>
                        <div className="space-y-2">
                            {PREVIOUS_CHATS.map((chat, idx) => (
                                <button key={idx} className="w-full text-left px-5 py-3 rounded-xl hover:bg-white/5 text-[10px] font-black italic uppercase tracking-widest text-slate-500 hover:text-[#13ecec] border border-transparent transition-all">
                                    {chat}_
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 italic flex items-center gap-3">
                            <Cpu size={14} className="text-[#13ecec]" /> Core Status
                        </h3>
                        <div className="p-6 glass-panel rounded-2xl border-white/5 bg-black/20 space-y-4">
                            <div className="flex justify-between items-center text-[8px] font-black uppercase italic text-slate-600">
                                <span>Processor Load</span>
                                <span>12%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full w-[12%] bg-[#13ecec] shadow-[0_0_10px_#13ecec]" />
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-black uppercase italic text-slate-600">
                                <span>Neural Heat</span>
                                <span>342K</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#8c25f4]/5 to-[#13ecec]/5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Globe size={40} className="text-white" />
                        </div>
                        <h4 className="text-[10px] font-black text-white italic uppercase tracking-[0.2em] mb-2 leading-none">Global Sync Pro</h4>
                        <p className="text-[10px] text-slate-600 font-medium italic mb-5 leading-relaxed">Access Tier 1 Intelligence & Unlimited Neural Reviews.</p>
                        <Button variant="ghost" className="h-12 w-full rounded-xl border-[#8c25f4]/30 text-[#8c25f4] text-[8px] font-black uppercase tracking-widest italic group-hover:bg-[#8c25f4] group-hover:text-white transition-all">
                            UPGRADE SIGNAL
                        </Button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Chat Matrix */}
            <motion.div variants={itemVariants} className="flex-1 flex flex-col glass-panel border-white/10 rounded-[3rem] bg-black/40 overflow-hidden h-full relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="lg:hidden flex items-center gap-5 p-8 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2px]">
                        <div className="w-full h-full bg-black rounded-[9px] flex items-center justify-center">
                            <Sparkles className="text-[#13ecec] w-5 h-5" />
                        </div>
                    </div>
                    <Typography variant="h4" className="mb-0 italic uppercase tracking-tighter text-white">Neural Nucleus_</Typography>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-12 py-8 space-y-10 custom-scrollbar pb-40">
                    <AnimatePresence mode="popLayout">
                        {messages.length === 1 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 mb-12 max-w-4xl mx-auto"
                            >
                                {SUGGESTIONS.map((sug, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInputValue(sug.text)}
                                        className="p-8 rounded-[2.5rem] glass-panel border-white/5 bg-black/20 hover:bg-white/5 hover:border-[#13ecec]/30 transition-all text-left group flex flex-col gap-5"
                                    >
                                        <div className="p-4 rounded-2xl bg-white/5 text-[#8c25f4] group-hover:text-[#13ecec] transition-colors border border-white/5">
                                            <sug.icon size={28} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-500 uppercase italic tracking-widest group-hover:text-white transition-colors">{sug.text}_</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        <div className="max-w-5xl mx-auto space-y-8">
                            {messages.map((msg) => (
                                <motion.div 
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={cn("flex gap-8", msg.role === 'user' ? "flex-row-reverse" : "")}
                                >
                                    <div className="shrink-0 mt-2">
                                        {msg.role === 'assistant' ? (
                                            <div className="w-10 h-10 rounded-xl bg-[#8c25f4]/10 flex items-center justify-center border border-[#8c25f4]/30 shadow-[0_0_20px_rgba(140,37,244,0.1)]">
                                                <Bot size={20} className="text-[#8c25f4]" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/10">
                                                <User size={20} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "max-w-[75%]",
                                        msg.role === 'user' ? "items-end flex flex-col" : "items-start flex flex-col"
                                    )}>
                                        {msg.isCode ? (
                                            <div className="w-full rounded-[1.5rem] overflow-hidden border border-white/10 bg-[#0d0a14] shadow-2xl mt-4">
                                                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-2 rounded-full bg-rose-500" />
                                                        <div className="size-2 rounded-full bg-amber-500" />
                                                        <div className="size-2 rounded-full bg-emerald-500" />
                                                        <span className="text-[10px] font-mono text-slate-600 uppercase italic tracking-widest ml-2">{msg.language} Protocol</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                                        className="text-slate-600 hover:text-[#13ecec] transition-colors flex items-center gap-3 text-[10px] font-black italic uppercase tracking-widest"
                                                    >
                                                        {copiedId === msg.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                        {copiedId === msg.id ? 'VERIFIED' : 'COPY SIG'}
                                                    </button>
                                                </div>
                                                <pre className="p-8 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed bg-black/40">
                                                    <code>{msg.content}</code>
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "px-8 py-5 rounded-[2rem] text-[15px] italic leading-relaxed shadow-xl",
                                                msg.role === 'user' 
                                                    ? "bg-[#8c25f4] text-white rounded-tr-none border border-white/10" 
                                                    : "glass-panel bg-black/40 text-slate-200 border-white/5 rounded-tl-none font-medium"
                                            )}>
                                                {msg.content}
                                            </div>
                                        )}
                                        <div className={cn(
                                            "mt-3 text-[8px] font-black tracking-widest text-slate-700 uppercase italic",
                                            msg.role === 'user' ? "mr-4" : "ml-4"
                                        )}>
                                            {msg.role === 'assistant' ? 'NUCLEUS RESPONSE_01' : 'SOURCE TRANSMISSION'}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-8">
                                    <div className="shrink-0 mt-2">
                                        <div className="w-10 h-10 rounded-xl bg-[#8c25f4]/10 flex items-center justify-center border border-[#8c25f4]/30">
                                            <Bot size={20} className="text-[#8c25f4]" />
                                        </div>
                                    </div>
                                    <div className="px-8 py-6 flex gap-2 items-center glass-panel bg-black/20 rounded-[2rem] border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-[#13ecec] animate-pulse" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[#13ecec] animate-pulse" style={{ animationDelay: '200ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-[#13ecec] animate-pulse" style={{ animationDelay: '400ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Main Input Dock */}
                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 shrink-0">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="relative glass-panel bg-black/60 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.8)] focus-within:border-[#13ecec]/40 focus-within:shadow-[0_0_50px_rgba(19,236,236,0.1)] transition-all group">
                            <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-black border border-white/10 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                <Terminal size={14} className="text-[#13ecec]" />
                            </div>
                            
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="SYNC WITH NEURAL NUCLEUS (CMD+ENTER)..."
                                className="w-full bg-transparent text-white placeholder:text-slate-800 px-6 py-5 outline-none resize-none min-h-[70px] max-h-48 text-xs font-black italic tracking-[0.2em] leading-relaxed uppercase"
                                rows={1}
                            />
                            
                            <div className="flex items-center justify-between px-4 pb-2">
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" className="size-12 rounded-xl text-slate-700 hover:text-white hover:bg-white/5">
                                        <Paperclip size={18} />
                                    </Button>
                                    <Button variant="ghost" className="size-12 rounded-xl text-slate-700 hover:text-white hover:bg-white/5">
                                        <Code2 size={18} />
                                    </Button>
                                    <div className="w-px h-6 bg-white/5 mx-2" />
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
                                            <span className="text-[7px] font-black text-slate-700 uppercase italic">GPT-4 Matrix</span>
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="h-14 px-8 bg-[#13ecec] hover:bg-[#13ecec]/80 disabled:opacity-30 text-black rounded-2xl transition-all shadow-[0_0_25px_#13ecec] flex items-center gap-4 text-[10px] font-black italic uppercase tracking-widest"
                                >
                                    INITIALIZE SIGNAL <Send size={18} className={inputValue.trim() ? "translate-x-1 -translate-y-1 transition-transform" : ""} />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex justify-center items-center gap-10 opacity-30">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={12} className="text-[#13ecec]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] italic text-slate-600">Secure Protocol Active</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Activity size={12} className="text-[#8c25f4]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] italic text-slate-600">Neural Sync 99.8%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
