import React from 'react';
import { 
    X, Zap, ShieldCheck, Cpu, 
    Link, MessageSquare, Loader2
} from 'lucide-react';

export interface JobApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isApplying: boolean;
    jobTitle: string;
    companyName: string;
    applyForm: { resumeUrl: string; coverLetter: string };
    setApplyForm: (form: { resumeUrl: string; coverLetter: string }) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
    isOpen,
    onClose,
    isApplying,
    jobTitle,
    companyName,
    applyForm,
    setApplyForm,
    onSubmit,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#020205]/80 backdrop-blur-md animate-in fade-in duration-500" 
                onClick={() => !isApplying && onClose()}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#08081a]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header Signal */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                
                <div className="p-8 lg:p-12 relative z-10">
                    <div className="flex justify-between items-start mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                                    <Cpu size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#8c25f4]">Neural Match Terminal</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
                                {isApplying ? 'Synchronizing Pipeline_' : `Mission Path: ${jobTitle}`}
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Transmission Target: {companyName}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {!isApplying ? (
                        <form onSubmit={onSubmit} className="space-y-8">
                            {/* AI Pre-check Signal */}
                            <div className="p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl flex items-center gap-6">
                                <div className="size-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/40 shrink-0">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white mb-1">AI Matching Verified_</p>
                                    <p className="text-[10px] leading-relaxed text-slate-400 font-medium">Your profile matches 98% of the core requirements. Auto-syncing skill matrix and performance history.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Link size={12} className="text-cyan-400" /> Professional Dossier (URL)
                                        </label>
                                        <span className="text-[9px] font-black uppercase tracking-tighter text-cyan-400/50">Required_</span>
                                    </div>
                                    <input
                                        type="url"
                                        className="w-full h-16 bg-slate-950 border border-white/5 rounded-2xl px-6 outline-none focus:border-[#8c25f4]/50 focus:ring-1 focus:ring-[#8c25f4]/30 transition-all font-bold text-white placeholder:text-slate-700"
                                        placeholder="https://drive.google.com/your-resume"
                                        required
                                        value={applyForm.resumeUrl}
                                        onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <MessageSquare size={12} className="text-purple-400" /> Career Trajectory Alignment
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-950 border border-white/5 rounded-3xl p-6 outline-none focus:border-[#8c25f4]/50 focus:ring-1 focus:ring-[#8c25f4]/30 transition-all font-bold text-white placeholder:text-slate-700 h-40 resize-none"
                                        placeholder="Briefly explain your vision for this role..."
                                        value={applyForm.coverLetter}
                                        onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-8 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-16 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-colors"
                                >
                                    Abort Mission
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] h-16 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-50 transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2"
                                >
                                    <Zap size={16} className="fill-current" /> Execute Application_
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="relative size-32">
                                <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-4 border-2 border-[#8c25f4]/30 border-b-transparent rounded-full animate-spin-slow"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-black uppercase tracking-widest italic text-white">Transmitting Data Vectors_</h3>
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 animate-pulse">Encrypting Profile Packet...</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8c25f4] opacity-50">Syncing with Company Nodes...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Status Bar */}
                <div className="h-12 bg-white/5 border-t border-white/5 flex items-center px-8 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">System Secure // E2E Encrypted</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8c25f4]">Orbital Hub v2.08</span>
                </div>
            </div>
        </div>
    );
};
