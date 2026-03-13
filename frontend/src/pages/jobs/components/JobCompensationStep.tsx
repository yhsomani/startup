import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface JobForm {
    title: string; location: string; type: string; remote: boolean; experienceLevel: string;
    description: string; requirements: string; skills: string[]; skillInput: string;
    salaryMin: string; salaryMax: string; currency: string; benefits: string[];
}

interface JobCompensationStepProps {
    form: JobForm;
    setField: (field: keyof JobForm, value: any) => void;
    toggleBenefit: (b: string) => void;
    BENEFITS: string[];
}

export const JobCompensationStep: React.FC<JobCompensationStepProps> = ({ form, setField, toggleBenefit, BENEFITS }) => {
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 relative group">
                    <select 
                        value={form.currency} 
                        onChange={e => setField('currency', e.target.value)} 
                        className="block px-6 pt-8 pb-3 w-full text-slate-100 bg-white/[0.03] rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 cursor-pointer font-bold italic"
                    >
                        {['₹', '$', '€', '£'].map(c => <option key={c} value={c} className="bg-[#0f0814] text-slate-100">{c}</option>)}
                    </select>
                    <label className="absolute text-[#8c25f4] text-[10px] font-black uppercase italic tracking-[0.2em] transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-6">
                        Currency (Yield Unit)
                    </label>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-[#8c25f4] transition-colors" size={20} />
                </div>
                
                <div className="md:col-span-4 relative group">
                    <input 
                        id="salary-min" 
                        type="number" 
                        placeholder=" " 
                        value={form.salaryMin}
                        onChange={e => setField('salaryMin', e.target.value)}
                        className="block px-6 pt-8 pb-3 w-full text-slate-100 bg-white/[0.03] rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 font-bold tracking-tight italic"
                    />
                    <label 
                        htmlFor="salary-min"
                        className="absolute text-slate-500 font-black uppercase italic tracking-[0.2em] text-[10px] duration-500 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-4 peer-focus:text-[#8c25f4]"
                    >
                        Yield Min (LPA) *
                    </label>
                </div>
                
                <div className="md:col-span-5 relative group">
                    <input 
                        id="salary-max" 
                        type="number" 
                        placeholder=" " 
                        value={form.salaryMax}
                        onChange={e => setField('salaryMax', e.target.value)}
                        className="block px-6 pt-8 pb-3 w-full text-slate-100 bg-white/[0.03] rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8c25f4]/30 focus:border-[#8c25f4]/50 peer transition-all duration-500 font-bold tracking-tight italic"
                    />
                    <label 
                        htmlFor="salary-max"
                        className="absolute text-slate-500 font-black uppercase italic tracking-[0.2em] text-[10px] duration-500 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-4 peer-focus:text-[#8c25f4]"
                    >
                        Yield Max (LPA) *
                    </label>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <label className="text-[10px] font-black italic uppercase tracking-[0.4em] text-slate-500">Resource Perks (Benefits)_</label>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    {BENEFITS.map(b => (
                        <button 
                            key={b} 
                            onClick={() => toggleBenefit(b)} 
                            className={cn(
                                'flex items-center gap-3 px-6 py-3 rounded-[1.2rem] text-[11px] font-black uppercase italic tracking-[0.15em] border transition-all duration-500 relative group/perk', 
                                form.benefits.includes(b) 
                                    ? 'bg-[#13ecec]/10 text-[#13ecec] border-[#13ecec]/40 shadow-[0_0_20px_rgba(19,236,236,0.15)] bg-gradient-to-br from-[#13ecec]/5 to-transparent' 
                                    : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.05]'
                            )}
                        >
                            <div className={cn(
                                "size-4 rounded-md border flex items-center justify-center transition-all duration-500",
                                form.benefits.includes(b) ? "bg-[#13ecec] border-[#13ecec]" : "bg-black/40 border-white/20"
                            )}>
                                {form.benefits.includes(b) && <Check size={10} className="text-black" strokeWidth={4} />}
                            </div>
                            <span>{b}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
