import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    CreditCard, Download, Zap, 
    Building2, Users,
    Shield, Activity,
    Lock, Wallet
} from 'lucide-react';
import { Typography } from '../../components/atoms/Typography';
import { Button } from '../../components/atoms/Button';
import { cn } from '../../utils/cn';

interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    desc: string;
    features: string[];
    cta: string;
    highlighted?: boolean;
    icon: React.ElementType;
    accent: string;
    glow: string;
}

const PLANS: Plan[] = [
    {
        id: 'free',
        name: 'Basic Node',
        price: 0,
        period: 'forever',
        desc: 'Core architecture access',
        features: [
            '5 job applications / month',
            'Basic Neural profile',
            'Limited Course Stream access',
            'Public challenges',
            'Standard network latency',
        ],
        cta: 'Current Plan',
        icon: Users,
        accent: 'text-slate-500',
        glow: 'group-hover:border-slate-800',
    },
    {
        id: 'pro',
        name: 'Elite Core',
        price: 999,
        period: 'month',
        desc: 'High-performance career scaling',
        features: [
            'Infinite application stream',
            'Priority neural visibility',
            'Full Nexus course access',
            'AI Career Architect',
            'Elite challenge rankings',
            'Direct recruiter uplink',
            'Quantum Resume feedback',
        ],
        cta: 'Upgrade to Elite',
        highlighted: true,
        icon: Zap,
        accent: 'text-[#8c25f4]',
        glow: 'group-hover:border-[#8c25f4]/40',
    },
    {
        id: 'enterprise',
        name: 'Mesh Network',
        price: 4999,
        period: 'month',
        desc: 'Scalable corporate intelligence',
        features: [
            'Complete Elite feature set',
            'Unlimited team nodes',
            'Custom growth paths',
            'Strategic Account Architect',
            'Advanced Mesh analytics',
            'Full API Interface',
            'Enterprise SLA uptime',
        ],
        cta: 'Establish Contact',
        icon: Building2,
        accent: 'text-[#13ecec]',
        glow: 'group-hover:border-[#13ecec]/40',
    },
];

const MOCK_INVOICES = [
    { id: 'inv-001', date: 'Mar 1, 2026', amount: '₹999', status: 'SYNCHRONIZED', plan: 'Elite Core Monthly' },
    { id: 'inv-002', date: 'Feb 1, 2026', amount: '₹999', status: 'SYNCHRONIZED', plan: 'Elite Core Monthly' },
    { id: 'inv-003', date: 'Jan 1, 2026', amount: '₹999', status: 'SYNCHRONIZED', plan: 'Elite Core Monthly' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const BillingPage: React.FC = () => {
    const [currentPlan] = useState<string>('free');
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

    const getPrice = (price: number) => {
        if (billingPeriod === 'annual') return Math.round(price * 0.8);
        return price;
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto pb-32 space-y-12"
        >
            {/* Header Module */}
            <motion.section variants={itemVariants} className="relative p-10 glass-panel rounded-[2.5rem] border-white/10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8c25f4]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/20">
                                <Wallet size={24} />
                            </div>
                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Financial Uplink Active</span>
                            </div>
                        </div>
                        <Typography variant="h1" className="text-white">Subscription Mesh_</Typography>
                        <p className="text-slate-400 font-medium italic">Manage your resource allocation and neural tier synchronizations.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="glass-panel px-6 py-4 rounded-3xl border-white/5 flex flex-col items-center justify-center min-w-[140px]">
                            <span className="text-2xl font-black text-[#13ecec] italic leading-none">FREE</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Status: Basic</span>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Neural Period Toggle */}
            <motion.div variants={itemVariants} className="flex flex-col items-center space-y-6">
                <div className="p-1 bg-black/40 rounded-2xl border border-white/5 flex">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={cn(
                            "px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase italic transition-all",
                            billingPeriod === 'monthly' ? "bg-white/10 text-white shadow-xl shadow-black/40" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Monthly Stream
                    </button>
                    <button
                        onClick={() => setBillingPeriod('annual')}
                        className={cn(
                            "px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase italic transition-all flex items-center gap-2",
                            billingPeriod === 'annual' ? "bg-white/10 text-white shadow-xl shadow-black/40" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Annual Sync <span className="bg-[#13ecec]/20 text-[#13ecec] px-2 py-0.5 rounded-lg text-[8px] animate-pulse">Save 20%</span>
                    </button>
                </div>
            </motion.div>

            {/* Plan Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map(plan => (
                    <motion.div
                        key={plan.id}
                        variants={itemVariants}
                        whileHover={{ y: -10 }}
                        className={cn(
                            "relative glass-panel p-10 rounded-[3rem] border-white/5 flex flex-col transition-all duration-500 group overflow-hidden bg-black/40",
                            plan.highlighted && "border-[#8c25f4]/30 shadow-[0_0_50px_rgba(140,37,244,0.1)]"
                        )}
                    >
                        {plan.highlighted && (
                            <div className="absolute top-0 right-0">
                                <div className="bg-[#8c25f4] text-white text-[8px] font-black uppercase tracking-widest px-6 py-1 transform rotate-45 translate-x-4 translate-y-2 shadow-xl italic">
                                    Optimized Tier
                                </div>
                            </div>
                        )}

                        <div className={cn("p-4 rounded-2xl bg-white/5 mb-8 self-start border border-white/5 transition-colors", plan.accent)}>
                            <plan.icon size={28} />
                        </div>

                        <div className="space-y-4 mb-8">
                            <Typography variant="h3" className="mb-0 text-white italic">{plan.name}_</Typography>
                            <p className="text-xs text-slate-500 font-medium italic min-h-[32px]">{plan.desc}</p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white italic tracking-tighter">
                                {plan.price === 0 ? '0' : `₹${getPrice(plan.price).toLocaleString()}`}
                            </span>
                            {plan.price > 0 && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">/ {billingPeriod === 'annual' ? 'yr' : 'mo'}</span>}
                        </div>

                        <div className="flex-1 space-y-4 mb-10">
                            {plan.features.map(f => (
                                <div key={f} className="flex items-start gap-3 text-xs font-bold text-slate-400 italic">
                                    <div className={cn("size-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse", plan.highlighted ? "bg-[#8c25f4]" : "bg-[#13ecec]")} />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant={plan.highlighted ? 'primary' : 'ghost'}
                            fullWidth
                            size="lg"
                            disabled={plan.id === currentPlan}
                            className={cn(
                                "rounded-2xl text-xs font-black uppercase tracking-widest italic",
                                plan.id === currentPlan ? "opacity-40" : ""
                            )}
                        >
                            {plan.id === currentPlan ? 'Sync Active' : plan.cta}
                        </Button>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Payment & Security */}
                <div className="lg:col-span-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Active Method */}
                        <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CreditCard size={20} className="text-[#13ecec]" />
                                    <Typography variant="h4" className="mb-0 italic">Active Interface_</Typography>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[9px] font-black italic border-white/5">UPDATE NODE</Button>
                            </div>
                            
                            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="size-14 bg-gradient-to-br from-[#13ecec] to-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-2xl">
                                    ELITE
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white italic tracking-widest">•••• •••• •••• 4242</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest mt-1">Expiry: 12 / 2027</p>
                                </div>
                                <div className="ml-auto px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest italic">
                                    Verified
                                </div>
                            </div>
                        </motion.section>

                        {/* Security Protocol */}
                        <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-[#8c25f4]" />
                                <Typography variant="h4" className="mb-0 italic">Security Protocol_</Typography>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <Lock size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-tight">SSL Quantum Encryption</p>
                                    <p className="text-[9px] font-bold italic">Your transactional metadata is resolved via secure mesh protocols.</p>
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    {/* Transaction History */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden">
                        <div className="px-10 py-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                            <Typography variant="h4" className="mb-0 italic">Synchronization History_</Typography>
                            <Activity size={18} className="text-slate-800" />
                        </div>
                        
                        <div className="divide-y divide-white/5">
                            {MOCK_INVOICES.map(inv => (
                                <div key={inv.id} className="flex items-center gap-8 px-10 py-6 hover:bg-white/5 transition-all group">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-black text-white italic tracking-tight group-hover:text-[#13ecec] transition-colors">{inv.plan}_</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest">{inv.date}</p>
                                    </div>
                                    <span className="text-sm font-black text-white italic">{inv.amount}</span>
                                    <div className="px-3 py-1 bg-[#13ecec]/10 border border-[#13ecec]/20 text-[#13ecec] rounded-lg text-[8px] font-black uppercase tracking-widest italic">
                                        {inv.status}
                                    </div>
                                    <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                                        <Download size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
};
