import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/organisms/Toast';
import api from '../../services/api';
import { 
    HelpCircle, X, ArrowRight, ArrowLeft, 
    Rocket, Sliders, Layout, Layers 
} from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

import { JobBasicsStep } from './components/JobBasicsStep';
import { JobDetailsStep } from './components/JobDetailsStep';
import { JobCompensationStep } from './components/JobCompensationStep';
import { JobPreviewStep } from './components/JobPreviewStep';
import type { JobForm } from './components/JobPreviewStep';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const EXPERIENCE_LEVELS = ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'];
const BENEFITS = ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Stock Options', 'Learning Budget', 'Gym Membership', 'Paid Leave', '401(k)'];

const STEPS = [
    { id: 1, title: 'Basics', subtitle: 'Signature ID', icon: Layout },
    { id: 2, title: 'Details', subtitle: 'Neural Requirements', icon: Layers },
    { id: 3, title: 'Compensation', subtitle: 'Yield Strategy', icon: Sliders },
    { id: 4, title: 'Preview', subtitle: 'Final Broadcast', icon: Rocket },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } }
};

export const JobPostingFlowPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<JobForm>({
        title: '', location: '', type: 'Full-time', remote: false, experienceLevel: '3-5 years',
        description: '', requirements: '', skills: [], skillInput: '',
        salaryMin: '', salaryMax: '', currency: '₹', benefits: [],
    });

    const setField = (field: keyof JobForm, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && form.skillInput.trim()) {
            e.preventDefault();
            if (!form.skills.includes(form.skillInput.trim())) {
                setField('skills', [...form.skills, form.skillInput.trim()]);
            }
            setField('skillInput', '');
        }
    };

    const removeSkill = (skill: string) => setField('skills', form.skills.filter(s => s !== skill));

    const toggleBenefit = (b: string) => {
        setField('benefits', form.benefits.includes(b) ? form.benefits.filter(x => x !== b) : [...form.benefits, b]);
    };

    const isStepValid = () => {
        if (step === 1) return form.title.trim() && form.location.trim() && form.type;
        if (step === 2) return form.description.trim().length > 50;
        return true;
    };

    const handlePublish = async (draft = false) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: form.title, location: form.location, type: form.type, remote: form.remote,
                description: form.description, requirements: form.requirements.split('\n').filter(Boolean),
                skills: form.skills, salaryRange: { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: form.currency },
                benefits: form.benefits, experienceLevel: form.experienceLevel, status: draft ? 'draft' : 'active',
            };
            await api.post('/api/v1/jobs', payload);
            addToast({ type: 'success', title: draft ? 'Draft saved!' : 'Job posted!', message: draft ? 'Your job posting has been saved as a draft.' : 'Your job is now live on TalentSphere.' });
            navigate('/jobs');
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to post job.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentStepConfig = STEPS.find(s => s.id === step)!;
    const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative min-h-screen w-full flex flex-col space-y-12 selection:bg-[var(--color-primary)]/30 pb-24"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[var(--color-primary)]/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-[var(--color-secondary)]/10 blur-[150px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Header Module */}
            <motion.section variants={itemVariants} className="relative p-12 lg:p-16 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-3xl bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-secondary)]/10 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[var(--color-primary)]/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-6">
                            <div className="p-4 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-[0_0_20px_rgba(140,37,244,0.2)]">
                                <Rocket size={28} className="animate-pulse" />
                            </div>
                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                                <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Recruiter Terminal v1.0</span>
                            </div>
                        </div>
                        <Typography variant="h1" className="text-white text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8] mb-2">Vector Deployment_</Typography>
                        <p className="text-slate-500 font-medium italic text-xl max-w-2xl leading-relaxed">Phase shift: Transitioning from local parameters to global role propagation.</p>
                    </div>

                    <div className="flex gap-6">
                        <Button 
                            variant="ghost" 
                            className="size-16 rounded-[1.5rem] bg-white/5 border-white/10 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all" 
                            onClick={() => navigate('/jobs')}
                        >
                            <X size={24} />
                        </Button>
                    </div>
                </div>
            </motion.section>

            {/* Vector Path (Progress Track) */}
            <motion.section variants={itemVariants} className="px-12 py-10 glass-panel rounded-[2.5rem] border-white/5 bg-black/60 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex justify-between items-end relative z-10">
                    <div className="flex items-center gap-10 overflow-x-auto no-scrollbar pb-2">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-6 shrink-0">
                                <div className="flex flex-col items-center gap-3">
                                    <div className={cn(
                                        "size-12 rounded-2xl border-2 transition-all duration-700 rotate-[45deg] flex items-center justify-center relative group/node",
                                        step === s.id 
                                            ? "bg-[var(--color-primary)] border-white shadow-[0_0_30px_rgba(140,37,244,0.5)]" 
                                            : step > s.id 
                                                ? "bg-[var(--color-secondary)] border-transparent" 
                                                : "bg-[#0a070d] border-white/10 hover:border-white/30"
                                    )}>
                                        <s.icon size={20} className={cn("-rotate-[45deg] transition-all duration-500", step === s.id ? "text-white scale-110" : step > s.id ? "text-black" : "text-slate-700 group-hover/node:text-slate-300")} />
                                        {step === s.id && <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl animate-pulse" />}
                                    </div>
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest italic transition-colors", step === s.id ? "text-[var(--color-primary)]" : "text-slate-600")}>0{s.id}</p>
                                </div>
                                <div className={cn("hidden xl:block transition-all duration-700", step === s.id ? "opacity-100 translate-x-0" : "opacity-40 -translate-x-2")}>
                                    <p className="text-[10px] font-bold text-white italic uppercase tracking-tighter mb-1">{s.title}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none">{s.subtitle}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="hidden lg:block w-16 h-[2px] relative bg-white/5 overflow-hidden">
                                        {step > s.id && <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] animate-slide-right" />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-right pl-10 border-l border-white/5">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none mb-3">Sync Progress</p>
                        <p className="text-4xl font-black text-[var(--color-secondary)] italic tracking-tighter leading-none">{Math.round(progressPercent)}%</p>
                    </div>
                </div>
                <div className="mt-8 h-[3px] w-full bg-[#0a070d] rounded-full overflow-hidden p-[1px] border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(progressPercent, 5)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-secondary)] rounded-full shadow-[0_0_20px_rgba(140,37,244,0.4)]"
                    />
                </div>
            </motion.section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Side Instructions */}
                <motion.div variants={itemVariants} className="hidden lg:block space-y-10">
                    <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-8 bg-black/60 shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                            <HelpCircle size={160} />
                        </div>
                        <div className="flex items-center gap-4 text-[var(--color-secondary)] relative z-10">
                            <div className="p-2 bg-[var(--color-secondary)]/10 rounded-lg">
                                <HelpCircle size={20} />
                            </div>
                            <h4 className="text-sm font-black italic uppercase tracking-[0.2em] mb-0 leading-none">Protocol_</h4>
                        </div>
                        <div className="space-y-6 relative z-10">
                            {[
                                { title: 'Signal Clarity', text: 'Objective role signatures reduce mesh interference by 35%.' },
                                { title: 'Yield Optima', text: 'Transparent yield strategies attract tier-1 neural nodes.' },
                            ].map((tip, idx) => (
                                <div key={idx} className="p-6 rounded-[1.8rem] bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/tip">
                                    <p className="text-[10px] font-black text-[var(--color-primary)] uppercase italic tracking-[0.2em] mb-2 group-hover/tip:translate-x-1 transition-transform">{tip.title}</p>
                                    <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="glass-panel p-10 rounded-[3rem] border-[var(--color-primary)]/30 bg-gradient-to-br from-[var(--color-primary)]/15 to-transparent space-y-6 shadow-xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-[var(--color-primary)]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h4 className="text-sm font-black italic uppercase tracking-[0.2em] text-[var(--color-primary)] relative z-10 leading-none">Neural Guard_</h4>
                        <p className="text-[11px] text-slate-400 font-bold uppercase italic tracking-widest leading-relaxed relative z-10">Your deployment vector is automatically refined by the central swarm for maximum engagement.</p>
                        <div className="pt-4 relative z-10">
                            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-[var(--color-primary)] w-[60%]" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Form Area */}
                <motion.main variants={itemVariants} className="lg:col-span-3 space-y-12">
                    <div className="glass-panel p-12 lg:p-16 rounded-[4rem] border-white/5 bg-black/60 min-h-[600px] flex flex-col shadow-3xl relative overflow-hidden group">
                        <div className="absolute -bottom-24 -right-24 size-96 bg-[var(--color-primary)]/5 blur-[100px] rounded-full pointer-events-none" />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                                className="flex-1 space-y-16"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-0 leading-none">{currentStepConfig.subtitle}_</h2>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <p className="text-[11px] font-black text-[var(--color-secondary)]/60 uppercase tracking-[0.4em] italic mb-0 leading-none">Processing deployment phase 0{step}...</p>
                                </div>

                                <div className="relative">
                                    {step === 1 && (
                                        <JobBasicsStep form={form} setField={setField} JOB_TYPES={JOB_TYPES} EXPERIENCE_LEVELS={EXPERIENCE_LEVELS} />
                                    )}
                                    {step === 2 && (
                                        <JobDetailsStep form={form} setField={setField} addSkill={addSkill} removeSkill={removeSkill} />
                                    )}
                                    {step === 3 && (
                                        <JobCompensationStep form={form} setField={setField} toggleBenefit={toggleBenefit} BENEFITS={BENEFITS} />
                                    )}
                                    {step === 4 && (
                                        <JobPreviewStep form={form} />
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row gap-8">
                        <Button 
                            variant="ghost" 
                            fullWidth
                            size="lg"
                            className="h-24 rounded-[2rem] border-white/10 bg-black/40 text-[11px] italic tracking-[0.4em] font-black uppercase hover:bg-white/5 hover:border-white/20 transition-all group/abort"
                            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
                        >
                            <ArrowLeft size={20} className="mr-4 transition-transform group-hover/abort:-translate-x-2" /> {step === 1 ? 'CEASE PROTOCOL' : 'RETRACT PHASE'}
                        </Button>
                        
                        {step < 4 ? (
                            <Button 
                                fullWidth
                                size="lg"
                                className="h-24 rounded-[2.5rem] text-[11px] italic tracking-[0.4em] font-black uppercase shadow-[0_20px_40px_rgba(140,37,244,0.3)] hover:shadow-[0_25px_50px_rgba(140,37,244,0.4)] active:scale-95 transition-all bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 border-none group/next"
                                disabled={!isStepValid()}
                                onClick={() => setStep(s => s + 1)} 
                            >
                                SYNCHRONIZE {STEPS[step].title} <ArrowRight size={20} className="ml-5 transition-transform group-hover/next:translate-x-2" />
                            </Button>
                        ) : (
                            <div className="flex-[2.5] flex flex-col sm:flex-row gap-6">
                                <Button 
                                    variant="ghost"
                                    fullWidth
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="h-24 rounded-[2rem] border-[var(--color-secondary)]/40 text-[var(--color-secondary)] text-[11px] italic tracking-[0.4em] font-black uppercase hover:bg-[var(--color-secondary)]/5 transition-all"
                                    onClick={() => handlePublish(true)} 
                                >
                                    ARCHIVE AS DRAFT_
                                </Button>
                                <Button 
                                    fullWidth
                                    size="lg"
                                    disabled={isSubmitting || !isStepValid()}
                                    className="h-24 rounded-[2.5rem] text-sm font-black uppercase italic tracking-[0.4em] shadow-[0_25px_50px_rgba(140,37,244,0.4)] hover:shadow-[0_30px_60px_rgba(140,37,244,0.6)] active:scale-95 transition-all bg-gradient-to-r from-[var(--color-primary)] to-purple-800 border-none relative overflow-hidden group/publish"
                                    onClick={() => handlePublish(false)} 
                                >
                                    <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover/publish:opacity-100 transition-opacity" />
                                    <span className="relative z-10">{isSubmitting ? 'PROPAGATING...' : 'PUBLISH DEPLOYMENT_'}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.main>
            </div>
        </motion.div>
    );
};
;
