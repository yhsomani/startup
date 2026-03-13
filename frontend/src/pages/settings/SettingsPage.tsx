import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Shield, Bell, CreditCard, Key, Eye, 
    Mail, Lock, Check, Settings, ShieldCheck,
    Globe, Activity, Zap, Cpu, Target, Briefcase, Smartphone
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Typography } from '../../components/atoms/Typography';
import { Button } from '../../components/atoms/Button';

type TabType = 'account' | 'privacy' | 'notifications' | 'security' | 'billing';

const SETTINGS_TABS: { id: TabType; label: string; icon: React.FC<any> }[] = [
    { id: 'account', label: 'Identity Node', icon: User },
    { id: 'privacy', label: 'Privacy Protocols', icon: Eye },
    { id: 'notifications', label: 'Neural Alerts', icon: Bell },
    { id: 'security', label: 'Security Firewall', icon: Shield },
    { id: 'billing', label: 'Resource Billing', icon: CreditCard },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any } }
};

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('security');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [profileVisible, setProfileVisible] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState({
        marketing: false,
        jobs: true,
        messages: true,
        network: true
    });

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-16 pb-40 px-4 sm:px-0"
        >
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[var(--color-background)]">
                <div className="absolute top-[15%] left-[-5%] w-[500px] h-[500px] bg-[var(--color-primary)]/05 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-secondary)]/05 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            {/* Core Configuration Header */}
            <motion.section variants={itemVariants} className="relative p-12 glass-panel rounded-[3.5rem] border-white/10 overflow-hidden group shadow-2xl bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/15 via-transparent to-[#13ecec]/10 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#8c25f4]/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                            <div className="p-4 rounded-3xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-2xl">
                                <Settings size={32} />
                            </div>
                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-3xl shadow-lg">
                                <span className="text-[10px] font-black text-[#13ecec] uppercase tracking-[0.4em] italic leading-none">System Config Active_</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white text-7xl tracking-tighter m-0 italic lg:leading-[0.9]">
                                Core Configuration_
                            </Typography>
                            <p className="text-slate-400 text-xl font-medium italic leading-relaxed max-w-2xl opacity-90 mx-auto md:mx-0">
                                Calibrate your neural parameters, privacy protocols, and account security thresholds for optimal matrix synchronization.
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-8 glass-panel p-10 rounded-[3rem] border-white/10 backdrop-blur-3xl shadow-2xl bg-black/20">
                        <div className="size-20 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] rounded-2xl flex items-center justify-center shadow-[0_0_40px_var(--color-secondary-glow)]">
                            <Cpu size={38} className="animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <Typography variant="h2" className="text-white mb-0 italic tracking-tighter text-3xl">Active Node_</Typography>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic leading-none">Status: Persistent</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Tactical Navigation (Side) */}
                <motion.div variants={itemVariants} className="w-full lg:w-96 shrink-0 lg:sticky lg:top-12">
                    <div className="glass-panel p-6 rounded-[3.5rem] border-white/5 space-y-3 bg-black/40 shadow-2xl">
                        <div className="px-6 py-4 mb-4">
                            <Typography variant="label" className="text-slate-600 uppercase tracking-[0.4em] text-[10px] font-black italic">Config Sectors_</Typography>
                        </div>
                        {SETTINGS_TABS.map((tab) => (
                            <motion.button
                                key={tab.id}
                                whileHover={{ x: 8 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-8 py-6 rounded-[2rem] transition-all duration-500 text-[11px] font-black uppercase tracking-[0.2em] italic group",
                                    activeTab === tab.id 
                                        ? "bg-[var(--color-primary)] text-white shadow-[0_20px_40px_var(--color-primary-glow)] scale-105 border-transparent" 
                                        : "text-slate-500 hover:text-white hover:bg-white/5 border-2 border-transparent hover:border-white/05"
                                )}
                            >
                                <span className="flex items-center gap-4">
                                    <tab.icon size={22} className={cn("transition-transform duration-500 group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-slate-800")} />
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && (
                                    <div className="size-2 bg-white rounded-full animate-ping" />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Quick System Info */}
                    <div className="mt-8 glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-[var(--color-secondary)]/10 to-transparent shadow-2xl space-y-6">
                        <div className="flex items-center gap-4">
                            <Shield size={20} className="text-[var(--color-secondary)]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Security Status</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                <span>Integrity</span>
                                <span className="text-[var(--color-secondary)]">94%</span>
                            </div>
                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '94%' }}
                                    className="h-full bg-[var(--color-secondary)] rounded-full shadow-[0_0_10px_var(--color-secondary-glow)]" 
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Primary Config Hub */}
                <motion.div variants={itemVariants} className="flex-1 min-h-[700px] w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            className="space-y-12"
                        >
                            {activeTab === 'security' && (
                                <div className="space-y-12">
                                    {/* 2FA Module */}
                                    <div className="glass-panel p-12 rounded-[3.5rem] border-white/5 space-y-10 bg-black/40 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <ShieldCheck size={140} className="text-[var(--color-primary)]" />
                                        </div>
                                        <div className="flex items-center gap-6 pb-10 border-b border-white/5">
                                            <div className="p-4 rounded-3xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] shadow-2xl shadow-[var(--color-primary)]/10">
                                                <Smartphone size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <Typography variant="h2" className="mb-0 italic text-white text-4xl tracking-tighter">Neural 2FA Protocol_</Typography>
                                                <p className="text-[10px] text-slate-500 font-black italic uppercase tracking-[0.4em]">Multi-layer identity verification mesh</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                                            <div className="flex-1 space-y-8">
                                                <div className="flex items-start gap-10 p-10 rounded-[2.5rem] bg-white/02 border-2 border-white/05 group hover:border-[var(--color-secondary)]/40 hover:bg-[var(--color-secondary)]/05 transition-all duration-500">
                                                    <div className="size-20 bg-[var(--color-secondary)]/15 rounded-3xl text-[var(--color-secondary)] flex items-center justify-center border border-[var(--color-secondary)]/30 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                                        <Activity size={38} className="animate-pulse" />
                                                    </div>
                                                    <div className="space-y-4 flex-1">
                                                        <h3 className="text-2xl font-black text-white italic tracking-tighter">Authenticator App_</h3>
                                                        <p className="text-lg text-slate-400 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                                                            Synchronize with Google Authenticator, Authy, or Microsoft Authenticator to resolve cryptographically secure identity signatures.
                                                        </p>
                                                        {twoFactorEnabled ? (
                                                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] italic shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                                                <Check strokeWidth={4} size={16} /> LINK ESTABLISHED
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/60 border border-white/10 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">
                                                                OFFLINE_SIGNAL
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <Button 
                                                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                                    className={cn(
                                                        "h-24 px-16 rounded-[2rem] text-[12px] font-black italic uppercase tracking-[0.2em] shadow-2xl transition-all duration-500",
                                                        twoFactorEnabled ? "bg-black text-rose-500 border-2 border-rose-500/40 hover:bg-rose-500 hover:text-white" : "bg-[var(--color-primary)] text-white shadow-[var(--color-primary-glow)] hover:bg-white hover:text-black"
                                                    )}
                                                >
                                                    {twoFactorEnabled ? 'DEACTIVATE PROTOCOL' : 'INITIALIZE SYNC_'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Module */}
                                    <div className="glass-panel p-12 rounded-[3.5rem] border-white/5 space-y-12 bg-black/60 shadow-2xl">
                                        <div className="flex items-center gap-6 pb-10 border-b border-white/5">
                                            <div className="p-4 rounded-3xl bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] shadow-2xl">
                                                <Key size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <Typography variant="h2" className="mb-0 italic text-white text-4xl tracking-tighter">Credential Rotation_</Typography>
                                                <p className="text-[10px] text-slate-500 font-black italic uppercase tracking-[0.4em]">Update your core encryption key</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-2">Current Cipher_</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-[var(--color-primary)] transition-all duration-500" size={24} />
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        className="w-full pl-20 pr-8 h-20 bg-black/40 border-2 border-white/05 rounded-[1.8rem] focus:border-[var(--color-primary)]/50 outline-none text-white text-xl italic font-black placeholder:text-slate-900 transition-all shadow-inner" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-2">New Cipher Signature_</label>
                                                <div className="relative group">
                                                    <Zap className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-[var(--color-secondary)] transition-all duration-500" size={24} />
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        className="w-full pl-20 pr-8 h-20 bg-black/40 border-2 border-white/05 rounded-[1.8rem] focus:border-[var(--color-secondary)]/50 outline-none text-white text-xl italic font-black placeholder:text-slate-900 transition-all shadow-inner" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <Button className="h-20 px-16 rounded-[1.8rem] text-[11px] font-black italic uppercase tracking-[0.4em] bg-white text-black hover:bg-[var(--color-secondary)] transition-all shadow-2xl">
                                                ROTATE ACCESS KEYS_
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-12">
                                    <div className="glass-panel p-12 rounded-[3.5rem] border-white/5 space-y-12 bg-black/40 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <Eye size={140} className="text-[var(--color-secondary)]" />
                                        </div>
                                        <div className="flex items-center gap-6 pb-10 border-b border-white/5">
                                            <div className="p-4 rounded-3xl bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] shadow-2xl">
                                                <Target size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <Typography variant="h2" className="mb-0 italic text-white text-4xl tracking-tighter">Visual Presence_</Typography>
                                                <p className="text-[10px] text-slate-500 font-black italic uppercase tracking-[0.4em]">Manage node visibility across the global matrix</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {[
                                                { 
                                                    label: 'Public Broadcast_', 
                                                    desc: 'Enable high-fidelity node discovery for all verified recruiters and external mesh segments.', 
                                                    checked: profileVisible, 
                                                    onChange: () => setProfileVisible(!profileVisible),
                                                    color: 'var(--color-secondary)'
                                                },
                                                { 
                                                    label: 'Pulse Synchronization_', 
                                                    desc: 'Broadcast active behavioral signals to all established neural links within your current mesh tier.', 
                                                    checked: true, 
                                                    onChange: () => {},
                                                    color: 'var(--color-primary)'
                                                },
                                                { 
                                                    label: 'Stealth Protocol_', 
                                                    desc: 'Encrypt activity logs and suppress profile updates during sensitive exploration cycles.', 
                                                    checked: false, 
                                                    onChange: () => {},
                                                    color: 'var(--color-warning)'
                                                }
                                            ].map((toggle, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-10 rounded-[2.8rem] bg-white/02 border-2 border-white/05 group/toggle hover:border-white/20 transition-all duration-700">
                                                    <div className="space-y-3 mb-8 md:mb-0">
                                                        <h3 className="text-2xl font-black text-white italic tracking-tighter group-active:translate-x-1 transition-transform">{toggle.label}</h3>
                                                        <p className="text-lg text-slate-400 italic max-w-xl leading-relaxed opacity-70 group-hover/toggle:opacity-100 transition-opacity">{toggle.desc}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer group/switch scale-125 md:scale-150 mr-4">
                                                        <input type="checkbox" className="sr-only peer" checked={toggle.checked} onChange={toggle.onChange} />
                                                        <div className="w-16 h-8 bg-black rounded-full border-2 border-white/10 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-800 after:rounded-full after:h-6 after:w-7 after:transition-all duration-500 peer-checked:after:bg-black peer-checked:after:shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ backgroundColor: toggle.checked ? toggle.color : 'transparent' }}></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-12">
                                    <div className="glass-panel p-12 rounded-[3.5rem] border-white/5 space-y-12 bg-black/40 shadow-2xl">
                                        <div className="flex items-center gap-6 pb-10 border-b border-white/5">
                                            <div className="p-4 rounded-3xl bg-pink-500/15 border border-pink-500/30 text-pink-500 shadow-2xl">
                                                <Bell size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <Typography variant="h2" className="mb-0 italic text-white text-4xl tracking-tighter">Neural Alerts_</Typography>
                                                <p className="text-[10px] text-slate-500 font-black italic uppercase tracking-[0.4em]">Filter the matrix signal from the static noise</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {[
                                                { id: 'jobs', label: 'Job Stream Sync_', desc: 'Real-time alerts for roles matching your core system architecture.', state: emailAlerts.jobs, icon: Briefcase },
                                                { id: 'messages', label: 'Direct Node Uplinks_', desc: 'Instant telemetry when entities attempt direct neural contact.', state: emailAlerts.messages, icon: Mail },
                                                { id: 'network', label: 'Mesh Topology_', desc: 'Notifications for sync requests and global profile observations.', state: emailAlerts.network, icon: Globe },
                                                { id: 'marketing', label: 'Matrix Signals_', desc: 'Global system updates and experimental feature broadcasts.', state: emailAlerts.marketing, icon: Activity },
                                            ].map(item => (
                                                <label 
                                                    key={item.id} 
                                                    className={cn(
                                                        "flex flex-col gap-6 p-10 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer relative overflow-hidden group/alert",
                                                        item.state ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30" : "bg-black/20 border-white/05 hover:border-white/20"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className={cn("p-4 rounded-2xl transition-all duration-500", item.state ? "bg-[var(--color-primary)] text-white" : "bg-white/5 text-slate-700")}>
                                                            <item.icon size={28} />
                                                        </div>
                                                        <div className="relative flex items-center justify-center size-10">
                                                            <input 
                                                                type="checkbox" 
                                                                className="peer appearance-none size-10 border-2 border-slate-900 rounded-xl bg-black checked:bg-white checked:border-white transition-all cursor-pointer"
                                                                checked={item.state}
                                                                onChange={(e) => setEmailAlerts(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                            />
                                                            <Check size={20} className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={5} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h3 className={cn("text-2xl font-black italic tracking-tighter transition-colors", item.state ? "text-white" : "text-slate-500 group-hover/alert:text-white")}>{item.label}</h3>
                                                        <p className="text-lg text-slate-400 font-medium italic leading-relaxed opacity-70 group-hover/alert:opacity-100 transition-opacity">{item.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="pt-6 flex justify-center">
                                            <Button size="lg" className="h-20 px-20 rounded-[1.8rem] text-[11px] font-black italic uppercase tracking-[0.4em] shadow-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:scale-105 transition-all">
                                                SAVE SIGNAL PARAMETERS_
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {['account', 'billing'].includes(activeTab) && (
                                <div className="glass-panel p-32 rounded-[4rem] border-white/10 text-center space-y-12 bg-black/60 shadow-2xl relative overflow-hidden flex flex-col items-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)]/10 via-transparent to-transparent pointer-events-none" />
                                    <div className="size-32 rounded-[2.5rem] bg-white/05 border-2 border-white/10 flex items-center justify-center text-slate-800 shadow-2xl group hover:rotate-12 transition-all duration-1000">
                                        {activeTab === 'account' ? <User size={64} className="animate-pulse" /> : <CreditCard size={64} className="animate-pulse" />}
                                    </div>
                                    <div className="space-y-6 max-w-xl">
                                        <Typography variant="h1" className="text-white text-5xl mb-0 italic tracking-tighter uppercase leading-[0.9]">{activeTab} Interface Under Construction_</Typography>
                                        <p className="text-slate-500 text-xl font-bold italic opacity-80">This architecture is being optimized for the 1.0 release mesh. Neural synchronization scheduled for Q2 spectral cycle.</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        className="h-16 px-12 rounded-2xl italic text-[10px] font-black tracking-[0.4em] border-white/10 hover:border-[#13ecec]/40 uppercase" 
                                        onClick={() => setActiveTab('security')}
                                    >
                                        RETURN TO SECURE SECTOR_
                                    </Button>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            <style>{`
                input::placeholder { color: #1a1a2e; }
                .glass-panel { backdrop-filter: blur(40px); }
            `}</style>
        </motion.div>
    );
};
