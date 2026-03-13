import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface JobForm {
    title: string; location: string; type: string; remote: boolean; experienceLevel: string;
    description: string; requirements: string; skills: string[]; skillInput: string;
    salaryMin: string; salaryMax: string; currency: string; benefits: string[];
}

export interface JobBasicsStepProps {
    form: JobForm;
    setField: (field: keyof JobForm, value: any) => void;
    JOB_TYPES: string[];
    EXPERIENCE_LEVELS: string[];
}

export const JobBasicsStep: React.FC<JobBasicsStepProps> = ({ form, setField, JOB_TYPES, EXPERIENCE_LEVELS }) => {
    return (
        <div className="space-y-10">
            <div className="space-y-8">
                {/* Floating Label Input: Job Title */}
                <div className="relative group">
                    <input 
                        id="job-title" 
                        type="text" 
                        placeholder=" " 
                        value={form.title}
                        onChange={e => setField('title', e.target.value)}
                        className="block px-6 pt-8 pb-3 w-full text-slate-100 bg-white/[0.03] rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 font-bold tracking-tight italic"
                    />
                    <label 
                        htmlFor="job-title"
                        className="absolute text-slate-500 font-black uppercase italic tracking-[0.2em] text-[10px] duration-500 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-4 peer-focus:text-[#8c25f4]"
                    >
                        Role Signature (Job Title) *
                    </label>
                </div>

                {/* Dept and Location */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 relative group">
                        <input 
                            id="location" 
                            type="text" 
                            placeholder=" " 
                            value={form.location}
                            onChange={e => setField('location', e.target.value)}
                            className="block px-6 pt-8 pb-3 w-full text-slate-100 bg-white/[0.03] rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 font-bold tracking-tight italic"
                        />
                        <label 
                            htmlFor="location"
                            className="absolute text-slate-500 font-black uppercase italic tracking-[0.2em] text-[10px] duration-500 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-4 peer-focus:text-[#8c25f4]"
                        >
                            Deployment Vector (Location) *
                        </label>
                        <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#13ecec] transition-colors" size={20} />
                    </div>
                    
                    <div className="md:col-span-4 flex items-center gap-4 px-6 py-4 border border-white/10 rounded-2xl bg-white/[0.03] h-full group hover:bg-white/[0.05] transition-all cursor-pointer" onClick={() => setField('remote', !form.remote)}>
                        <div className={cn(
                            "size-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                            form.remote ? "bg-[#13ecec] border-[#13ecec] shadow-[0_0_15px_rgba(19,236,236,0.3)]" : "bg-black/40 border-white/20"
                        )}>
                            {form.remote && <div className="size-2 bg-black rounded-sm" />}
                        </div>
                        <label htmlFor="remote" className="text-[11px] font-black text-slate-300 uppercase italic tracking-widest cursor-pointer select-none">Global Shift (Remote)</label>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <label className="text-[10px] font-black italic uppercase tracking-[0.4em] text-slate-500">Assignment Class_</label>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    {JOB_TYPES.map(t => (
                        <button 
                            key={t} 
                            onClick={() => setField('type', t)} 
                            className={cn(
                                'px-6 py-3.5 rounded-[1.2rem] text-[11px] font-black uppercase italic tracking-[0.15em] border transition-all duration-500 relative overflow-hidden group/btn', 
                                form.type === t 
                                    ? 'bg-[#8c25f4] text-white border-white/20 shadow-[0_10px_30px_rgba(140,37,244,0.3)]' 
                                    : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.05]'
                            )}
                        >
                            <span className="relative z-10">{t}</span>
                            {form.type === t && <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <label className="text-[10px] font-black italic uppercase tracking-[0.4em] text-slate-500">Neural Node Depth_</label>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    {EXPERIENCE_LEVELS.map(l => (
                        <button 
                            key={l} 
                            onClick={() => setField('experienceLevel', l)} 
                            className={cn(
                                'px-6 py-3.5 rounded-[1.2rem] text-[11px] font-black uppercase italic tracking-[0.15em] border transition-all duration-500 relative group/btn', 
                                form.experienceLevel === l 
                                    ? 'bg-[#13ecec] text-black border-white/20 shadow-[0_10px_30px_rgba(19,236,236,0.3)]' 
                                    : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.05]'
                            )}
                        >
                            <span className="relative z-10">{l}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
