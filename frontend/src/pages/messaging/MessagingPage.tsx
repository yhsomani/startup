import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, Send, Paperclip, Smile, MoreVertical, 
    Video, Phone, Radio, ShieldCheck,
    Zap, Activity, Clock, Sparkles
} from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

interface Contact {
    id: string;
    name: string;
    initials: string;
    lastMessage: string;
    lastTime: string;
    unread: number;
    online: boolean;
    color: string;
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    time: string;
    status?: 'sent' | 'delivered' | 'read';
}

const MOCK_CONTACTS: Contact[] = [
    { id: 'u2', name: 'Priya Sharma', initials: 'PS', lastMessage: 'Sounds good! See you then.', lastTime: '2m', unread: 2, online: true, color: 'from-[#8c25f4] to-[#13ecec]' },
    { id: 'u3', name: 'Rajan Mehta', initials: 'RM', lastMessage: 'Thanks for the referral!', lastTime: '1h', unread: 0, online: true, color: 'from-[#13ecec] to-[#0ea5e9]' },
    { id: 'u4', name: 'Sneha Patel', initials: 'SP', lastMessage: 'Did you check the PR?', lastTime: '3h', unread: 1, online: false, color: 'from-[#8c25f4] to-[#ec4899]' },
    { id: 'u5', name: 'Aarav Johnson', initials: 'AJ', lastMessage: 'Happy to connect!', lastTime: '1d', unread: 0, online: false, color: 'from-amber-600 to-orange-700' },
    { id: 'u6', name: 'Kavya R.', initials: 'KR', lastMessage: "I'll send you my resume.", lastTime: '2d', unread: 0, online: false, color: 'from-sky-500 to-blue-700' },
];

const MOCK_THREAD: Record<string, Message[]> = {
    u2: [
        { id: 'm1', senderId: 'u2', text: 'Hey! Are you free for a quick call tomorrow?', time: '10:30 AM' },
        { id: 'm2', senderId: 'me', text: 'Yes! What time works for you?', time: '10:32 AM' },
        { id: 'm3', senderId: 'u2', text: 'How about 3 PM IST?', time: '10:33 AM' },
        { id: 'm4', senderId: 'me', text: "Perfect. I'll send a calendar invite.", time: '10:34 AM' },
        { id: 'm5', senderId: 'u2', text: 'Sounds good! See you then.', time: '10:35 AM', status: 'read' },
    ],
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const MessagingPage: React.FC = () => {
    const { user } = useAuth();
    const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
    const [selectedId, setSelectedId] = useState<string>('u2');
    const [messages, setMessages] = useState<Message[]>(MOCK_THREAD['u2'] ?? []);
    const [searchQ, setSearchQ] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const selectedContact = contacts.find(c => c.id === selectedId);

    useEffect(() => {
        if (selectedId) {
            setLoading(true);
            setTimeout(() => {
                setMessages(MOCK_THREAD[selectedId] ?? []);
                setLoading(false);
            }, 300);
        }
    }, [selectedId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!newMsg.trim()) return;
        const msg: Message = {
            id: `m${Date.now()}`,
            senderId: 'me',
            text: newMsg.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        setMessages(prev => [...prev, msg]);
        setNewMsg('');
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQ.toLowerCase())
    );

    const myInitials = `${user?.firstName?.[0] ?? 'M'}${user?.lastName?.[0] ?? 'E'}`.toUpperCase();

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 w-full h-[calc(100vh-160px)] max-w-7xl mx-auto pb-4 px-4 sm:px-0"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-[#8c25f4]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-[#13ecec]/05 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="flex-1 glass-panel border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex divide-x divide-white/05 bg-black/40 relative">
                
                {/* Visual Purity Overlays */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-0" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-0" />

                {/* Sidebar: Neural Contact Grid */}
                <motion.div variants={itemVariants} className="w-[420px] flex flex-col bg-black/20 relative z-10 shrink-0">
                    <div className="p-10 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl bg-[#8c25f4]/15 text-[#8c25f4] border border-[#8c25f4]/30 shadow-2xl">
                                    <Radio size={24} className="animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <Typography variant="h3" className="mb-0 italic uppercase tracking-tighter text-3xl text-white">Neural Uplink_</Typography>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Encrypted Mesh: Active</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="size-14 p-0 rounded-2xl border-white/05 bg-white/05 hover:bg-[#13ecec] hover:text-black transition-all">
                                <Sparkles size={24} />
                            </Button>
                        </div>

                        <div className="relative group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-[#13ecec] transition-all duration-500" />
                            <input 
                                className="w-full h-16 pl-16 pr-8 bg-black/40 border-2 border-white/05 focus:border-[#13ecec]/40 rounded-[1.5rem] text-sm uppercase font-black italic tracking-widest outline-none transition-all placeholder:text-slate-900 text-white shadow-inner"
                                placeholder="TRACE TRANSMISSION_"
                                value={searchQ}
                                onChange={e => setSearchQ(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-12 custom-scrollbar">
                        <div className="px-6 py-2 mb-4">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">Active Nodes_</span>
                        </div>
                        {filteredContacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedId(contact.id)}
                                className={cn(
                                    "w-full flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-700 group relative overflow-hidden",
                                    selectedId === contact.id 
                                        ? "bg-[#8c25f4] text-white shadow-[0_20px_40px_rgba(140,37,244,0.3)] scale-[1.02] border-transparent" 
                                        : "hover:bg-white/05 border-2 border-transparent hover:border-white/10"
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className={cn(
                                        "size-16 rounded-[1.5rem] bg-gradient-to-br p-[2px] shadow-2xl transition-all duration-700 group-hover:rotate-12",
                                        selectedId === contact.id ? "from-white/40 to-white/10" : contact.color
                                    )}>
                                        <div className="w-full h-full rounded-[1.4rem] bg-[#050510] flex items-center justify-center text-white font-black text-base italic overflow-hidden">
                                            {contact.initials}
                                        </div>
                                    </div>
                                    {contact.online && (
                                        <span className={cn(
                                            "absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-[#050510] shadow-[0_0_10px_#13ecec] transition-all",
                                            selectedId === contact.id ? "bg-white" : "bg-[#13ecec] animate-pulse"
                                        )} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={cn(
                                            "text-sm font-black italic uppercase tracking-tighter truncate transition-colors",
                                            selectedId === contact.id ? "text-white" : "text-[#13ecec] group-hover:text-white"
                                        )}>{contact.name}_</span>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest opacity-60",
                                            selectedId === contact.id ? "text-white" : "text-slate-600"
                                        )}>{contact.lastTime}</span>
                                    </div>
                                    <p className={cn(
                                        "text-[11px] truncate font-bold italic transition-colors leading-relaxed",
                                        selectedId === contact.id ? "text-white/80" : "text-slate-500 group-hover:text-slate-300"
                                    )}>{contact.lastMessage}</p>
                                </div>
                                {contact.unread > 0 && selectedId !== contact.id && (
                                    <div className="size-7 bg-[#13ecec] rounded-xl flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_20px_#13ecec] animate-pulse">
                                        {contact.unread}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Main Hub: Transmission Stream */}
                <motion.div variants={itemVariants} className="flex-1 flex flex-col bg-black/10 relative z-10 overflow-hidden">
                    {/* Immersive Header */}
                    <header className="px-12 py-8 border-b border-white/10 flex items-center justify-between backdrop-blur-3xl sticky top-0 z-30 bg-black/40">
                        {selectedContact ? (
                            <div className="flex items-center gap-8">
                                <div className={cn(
                                    "size-14 rounded-2xl bg-gradient-to-br p-[2px] shadow-2xl relative group/avatar",
                                    selectedContact.color
                                )}>
                                    <div className="w-full h-full rounded-[1.2rem] bg-[#050510] flex items-center justify-center text-white font-black text-sm italic overflow-hidden">
                                        {selectedContact.initials}
                                    </div>
                                    {selectedContact.online && <div className="absolute inset-0 bg-[#13ecec]/10 rounded-[1.2rem] animate-pulse" />}
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <Typography variant="h4" className="mb-0 italic uppercase tracking-tighter text-3xl text-white leading-none">{selectedContact.name}_</Typography>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            selectedContact.online ? "bg-[#13ecec] animate-pulse shadow-[0_0_12px_#13ecec]" : "bg-slate-800 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.3em] italic leading-none",
                                            selectedContact.online ? "text-[#13ecec]" : "text-slate-700"
                                        )}>
                                            {selectedContact.online ? 'QUANTUM SYNC ESTABLISHED' : 'LINK OFFLINE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-6">
                            <Button variant="ghost" className="size-16 rounded-2xl bg-white/05 border-white/05 text-slate-500 hover:text-[#13ecec] hover:border-[#13ecec]/30 transition-all hover:scale-110">
                                <Video size={28} />
                            </Button>
                            <Button variant="ghost" className="size-16 rounded-2xl bg-white/05 border-white/05 text-slate-500 hover:text-[#8c25f4] hover:border-[#8c25f4]/30 transition-all hover:scale-110">
                                <Phone size={28} />
                            </Button>
                            <div className="w-px h-10 bg-white/10 mx-2" />
                            <Button variant="ghost" className="size-16 rounded-2xl bg-white/05 border-white/05 text-slate-600 hover:text-white transition-all">
                                <MoreVertical size={28} />
                            </Button>
                        </div>
                    </header>

                    {/* Integrated Transmission Log */}
                    <div className="flex-1 overflow-y-auto px-16 py-16 space-y-12 custom-scrollbar relative">
                        {/* Background Detail */}
                        <div className="absolute inset-0 opacity-05 pointer-events-none z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>

                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <div className="flex flex-col gap-10">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                                            <div className="w-96 h-32 bg-white/05 rounded-[3rem] border border-white/05 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === 'me';
                                    return (
                                        <motion.div 
                                            key={msg.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className={cn("flex group/msg", isMe ? "justify-end" : "justify-start")}
                                        >
                                            <div className={cn("flex gap-8 max-w-[70%]", isMe ? "flex-row-reverse" : "flex-row")}>
                                                <div className={cn(
                                                    "size-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-[11px] font-black transition-all duration-700 group-hover/msg:scale-110 shadow-2xl",
                                                    isMe ? "bg-[#8c25f4] text-white rotate-3" : `bg-gradient-to-br ${selectedContact?.color} text-white -rotate-3`
                                                )}>
                                                    {isMe ? myInitials[0] : selectedContact?.initials[0]}
                                                </div>
                                                <div className={cn("space-y-3", isMe ? "text-right" : "text-left")}>
                                                    <div className={cn(
                                                        "px-10 py-6 rounded-[2.8rem] text-[15px] font-medium leading-relaxed relative group-hover/msg:shadow-2xl transition-all duration-500",
                                                        isMe 
                                                            ? "bg-[#8c25f4] text-white rounded-tr-none shadow-[0_20px_40px_rgba(140,37,244,0.15)] italic font-bold" 
                                                            : "glass-panel bg-black/60 text-slate-200 border-white/10 rounded-tl-none font-medium"
                                                    )}>
                                                        {msg.text}
                                                        <div className={cn(
                                                            "absolute top-0 size-4 translate-y-[-50%] pointer-events-none",
                                                            isMe ? "right-0 translate-x-[30%] rotate-45 bg-[#8c25f4]" : "left-0 translate-x-[-30%] rotate-45 bg-[#050510] border-l border-t border-white/10"
                                                        )} />
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center gap-4 text-[9px] font-black tracking-[0.3em] uppercase italic text-slate-600 transition-opacity opacity-40 group-hover/msg:opacity-100",
                                                        isMe ? "flex-row-reverse" : ""
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={10} />
                                                            <span>{msg.time}</span>
                                                        </div>
                                                        {isMe && (
                                                            <div className="flex items-center gap-2">
                                                                <Zap size={10} className="text-[#13ecec] fill-current" />
                                                                <span className="text-[#13ecec]">DELIVERED</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                        <div ref={bottomRef} className="h-4" />
                    </div>

                    {/* Integrated Input Terminal */}
                    <footer className="p-10 bg-black/40 backdrop-blur-3xl border-t border-white/10 relative z-30">
                        <div className="relative group/input">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#8c25f4]/30 to-[#13ecec]/30 rounded-[2.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition-all duration-1000" />
                            <div className="relative flex items-center gap-6 glass-panel border-white/10 focus-within:border-[#13ecec]/50 p-4 rounded-[2.5rem] transition-all shadow-2xl bg-[#050510]">
                                <Button variant="ghost" className="size-16 rounded-2xl text-slate-700 hover:text-white hover:bg-white/05 transition-all">
                                    <Paperclip size={24} />
                                </Button>
                                <input 
                                    className="flex-1 bg-transparent py-6 text-sm font-black uppercase tracking-[0.2em] italic text-white outline-none placeholder:text-slate-900"
                                    placeholder={`TRANSMITTING TO ${selectedContact?.name.split(' ')[0] || 'TARGET'}_`}
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                />
                                <div className="flex gap-4">
                                    <Button variant="ghost" className="size-16 rounded-2xl text-slate-700 hover:text-[#13ecec] hover:bg-white/05 transition-all">
                                        <Smile size={24} />
                                    </Button>
                                    <Button 
                                        onClick={handleSend}
                                        disabled={!newMsg.trim()}
                                        className={cn(
                                            "size-18 rounded-2xl transition-all duration-700 flex items-center justify-center shadow-2xl",
                                            newMsg.trim() 
                                                ? "bg-[#13ecec] text-black shadow-[0_0_30px_rgba(19,236,236,0.4)] scale-110 rotate-3 hover:rotate-12" 
                                                : "bg-slate-900/50 text-slate-800 opacity-20"
                                        )}
                                    >
                                        <Send size={28} className="translate-x-0.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center items-center gap-12 opacity-40">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={14} className="text-[#13ecec]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] italic text-slate-600">Quantum Uplink Encrypted</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Activity size={14} className="text-[#8c25f4]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] italic text-slate-600">Sync Status: Optimal</span>
                            </div>
                        </div>
                    </footer>
                </motion.div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(140,37,244,0.3); }
                input::placeholder { color: #1a1a2e; }
            `}</style>
        </motion.div>
    );
};
