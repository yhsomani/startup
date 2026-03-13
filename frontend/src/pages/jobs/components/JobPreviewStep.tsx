import React from 'react';
import { MapPin, Briefcase, Clock, Banknote, Globe, Bookmark } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface JobForm {
    title: string; location: string; type: string; remote: boolean; experienceLevel: string;
    description: string; requirements: string; skills: string[]; skillInput: string;
    salaryMin: string; salaryMax: string; currency: string; benefits: string[];
}

interface JobPreviewStepProps {
    form: JobForm;
}

export const JobPreviewStep: React.FC<JobPreviewStepProps> = ({ form }) => {
    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h4 className="text-white font-black italic uppercase tracking-[0.2em] flex items-center gap-3 text-2xl">
                        <span className="size-3 bg-[#8c25f4] rounded-full animate-pulse shadow-[0_0_15px_rgba(140,37,244,0.8)]"></span>
                        Signal Broadcast Preview
                    </h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-[0.4em] mt-1 ml-6">Live neural simulation v4.0</p>
                </div>
                <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] italic">
                        OPTIMIZED FOR HIGH-AFFINITY
                    </span>
                </div>
            </div>

            {/* Preview Card (High-Fidelity) */}
            <div className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-[3rem] p-10 relative overflow-hidden group shadow-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                    <Bookmark className="text-white h-12 w-12" />
                </div>
                
                <div className="flex items-center gap-8 mb-10 relative z-10">
                    <div className="size-24 rounded-[1.8rem] bg-gradient-to-br from-[#8c25f4] via-[#8c25f4] to-indigo-700 flex items-center justify-center text-white shadow-2xl relative overflow-hidden group/logo">
                        <div className="absolute inset-0 bg-white/10 group-hover/logo:scale-110 transition-transform duration-700" />
                        <Briefcase size={40} className="relative z-10 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                             <h5 className="text-white font-black italic tracking-tighter text-3xl leading-tight uppercase">{form.title || 'NULL_SIGNAL'}</h5>
                             <div className="px-3 py-1 bg-[#13ecec]/10 rounded border border-[#13ecec]/30">
                                <span className="text-[8px] font-black text-[#13ecec] uppercase tracking-widest">PRO_VERIFIED</span>
                             </div>
                        </div>
                        <p className="text-slate-400 text-lg font-medium italic tracking-wide">Sync with <span className="text-white font-bold">TalentSphere Global</span></p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-10 relative z-10">
                    {[
                        { icon: Clock, text: form.type || 'Undefined Type', color: 'text-[#8c25f4]' },
                        { icon: Banknote, text: `${form.currency}${form.salaryMin} - ${form.salaryMax} LPA`, color: 'text-emerald-400' },
                        ...(form.remote ? [{ icon: Globe, text: 'Global (Remote)', color: 'text-blue-400' }] : []),
                        ...(form.location && !form.remote ? [{ icon: MapPin, text: form.location, color: 'text-[#13ecec]' }] : []),
                    ].map((tag, i) => (
                        <span key={i} className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[12px] font-bold text-slate-200 flex items-center gap-3 shadow-lg hover:bg-white/5 transition-colors cursor-default group/tag">
                            <tag.icon size={16} className={cn(tag.color, "transition-transform group-hover/tag:scale-125")} /> {tag.text}
                        </span>
                    ))}
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                    
                    {form.description ? (
                        <div className="text-[15px] text-slate-400 leading-relaxed font-medium italic line-clamp-4">
                            {form.description}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="h-3 w-3/4 rounded-full bg-white/5 animate-pulse"></div>
                            <div className="h-3 w-full rounded-full bg-white/5 animate-pulse delay-75"></div>
                            <div className="h-3 w-1/2 rounded-full bg-white/5 animate-pulse delay-150"></div>
                        </div>
                    )}

                    {form.skills.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {form.skills.slice(0, 6).map(s => (
                                <span key={s} className="px-5 py-2 rounded-xl bg-[#8c25f4]/15 text-[#8c25f4] text-[10px] font-black uppercase italic tracking-widest border border-[#8c25f4]/30 shadow-lg">
                                    {s}
                                </span>
                            ))}
                            {form.skills.length > 6 && (
                                <span className="px-5 py-2 rounded-xl bg-white/5 text-slate-500 text-[10px] font-black uppercase italic tracking-widest border border-white/5">
                                    +{form.skills.length - 6} MORE NODES
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-12 group/action">
                     <div className="w-full py-6 rounded-[2rem] bg-gradient-to-r from-white/[0.05] to-transparent text-white font-black italic text-sm border border-white/10 flex items-center justify-center gap-4 group-hover/action:border-[#8c25f4]/30 group-hover/action:bg-[#8c25f4]/5 group-hover/action:shadow-[0_0_30px_rgba(140,37,244,0.2)] transition-all duration-700">
                        <div className="size-2 rounded-full bg-[#8c25f4] animate-ping" />
                        ENGAGE WITH ROLE SIGNATURE
                        <div className="size-2 rounded-full bg-[#13ecec] animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
