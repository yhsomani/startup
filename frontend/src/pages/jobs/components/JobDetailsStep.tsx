import React from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface JobForm {
    title: string; location: string; type: string; remote: boolean; experienceLevel: string;
    description: string; requirements: string; skills: string[]; skillInput: string;
    salaryMin: string; salaryMax: string; currency: string; benefits: string[];
}

interface JobDetailsStepProps {
    form: JobForm;
    setField: (field: keyof JobForm, value: any) => void;
    addSkill: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    removeSkill: (skill: string) => void;
}

export const JobDetailsStep: React.FC<JobDetailsStepProps> = ({ form, setField, addSkill, removeSkill }) => {
    return (
        <div className="space-y-10">
            {/* Description Textarea */}
            <div className="flex flex-col rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden focus-within:ring-2 focus-within:ring-[#8c25f4]/30 focus-within:border-[#8c25f4]/50 transition-all duration-500 shadow-2xl relative">
                <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
                    <span className={cn(
                        "text-[9px] font-black uppercase italic tracking-widest px-3 py-1 rounded-full border transition-colors duration-500",
                        form.description.length < 50 
                            ? "text-rose-400 border-rose-500/30 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
                            : "text-[#13ecec] border-[#13ecec]/30 bg-[#13ecec]/5 shadow-[0_0_15px_rgba(19,236,236,0.2)]"
                    )}>
                        {form.description.length} Units / 50 MIN
                    </span>
                </div>
                <div className="px-8 pt-8 pb-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-[0.4em] block mb-2">Role Blueprint (Description) *</label>
                </div>
                <textarea
                    rows={8}
                    className="w-full px-8 py-4 bg-transparent border-0 text-[15px] font-medium leading-relaxed resize-none focus:ring-0 text-slate-100 placeholder-slate-600 italic no-scrollbar"
                    placeholder="Describe the neural synchronization requirements, team dynamics, and operational objectives..."
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                />
                <div className="h-2 w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-4" />
            </div>

            {/* Requirements Textarea */}
            <div className="flex flex-col rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden focus-within:ring-2 focus-within:ring-[#8c25f4]/30 focus-within:border-[#8c25f4]/50 transition-all duration-500 shadow-2xl">
                <div className="px-8 pt-8 pb-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-[0.4em] block mb-2">Hardware/Software Mesh (Requirements)</label>
                </div>
                <textarea
                    rows={6}
                    className="w-full px-8 py-4 bg-transparent border-0 text-[15px] font-medium leading-relaxed resize-none focus:ring-0 text-slate-100 placeholder-slate-600 italic no-scrollbar"
                    placeholder="Enter requirements line by line - each line becomes a distinct neural constraint..."
                    value={form.requirements}
                    onChange={e => setField('requirements', e.target.value)}
                />
            </div>

            {/* Skills Matrix */}
            <div className="space-y-6">
                <div className="relative group">
                    <input
                        id="skills-input"
                        type="text"
                        placeholder=" "
                        value={form.skillInput}
                        onChange={e => setField('skillInput', e.target.value)}
                        onKeyDown={addSkill}
                        className="block px-8 pt-10 pb-4 w-full text-slate-100 bg-white/[0.03] rounded-3xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 font-bold tracking-tight italic"
                    />
                    <label 
                        htmlFor="skills-input"
                        className="absolute text-slate-500 font-black uppercase italic tracking-[0.2em] text-[10px] duration-500 transform -translate-y-4 scale-75 top-6 z-10 origin-[0] left-8 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-4 peer-focus:text-[#8c25f4]"
                    >
                        Skill Spectrum Initialization (Press Enter)
                    </label>
                    <Plus className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-[#13ecec] transition-colors" size={24} />
                </div>
                
                {form.skills.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-4">
                        {form.skills.map(s => (
                            <button 
                                key={s} 
                                onClick={() => removeSkill(s)} 
                                className="flex items-center gap-3 px-6 py-2.5 rounded-[1rem] bg-[#8c25f4]/15 border border-[#8c25f4]/30 shadow-[0_5px_15px_rgba(140,37,244,0.2)] text-[#8c25f4] text-[11px] font-black uppercase italic tracking-widest hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 hover:shadow-[0_5px_20px_rgba(244,63,94,0.3)] transition-all duration-300 group"
                            >
                                <span className="translate-y-[1px]">{s}</span>
                                <X size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
