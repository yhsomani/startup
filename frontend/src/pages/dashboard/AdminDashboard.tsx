import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Shield, Database, Settings, 
    Zap, Wrench, Share2,
    TrendingUp
} from 'lucide-react';
import { Typography } from '../../components/atoms/Typography';
import { Button } from '../../components/atoms/Button';
import { cn } from '../../utils/cn';

interface SystemMetric {
    label: string;
    value: string;
    status: 'optimal' | 'warning' | 'critical';
    trend: string;
    color: string;
}

interface ServiceHealth {
    name: string;
    type: 'Node.js' | 'Spring Boot' | 'Python' | 'Database';
    status: 'online' | 'degraded' | 'offline';
    uptime: string;
    latency: string;
}

const MOCK_METRICS: SystemMetric[] = [
    { label: 'CPU Usage', value: '42%', status: 'optimal', trend: '+2% from last hr', color: 'var(--color-secondary)' },
    { label: 'Memory', value: '7.8GB', status: 'optimal', trend: 'Stable', color: '#10b981' },
    { label: 'API Latency', value: '124ms', status: 'optimal', trend: '-12ms', color: 'var(--color-primary)' },
    { label: 'Error Rate', value: '0.02%', status: 'optimal', trend: 'N/A', color: '#f59e0b' },
];

const MOCK_SERVICES: ServiceHealth[] = [
    { name: 'API Gateway', type: 'Node.js', status: 'online', uptime: '14d 2h', latency: '45ms' },
    { name: 'Auth Service', type: 'Spring Boot', status: 'online', uptime: '4d 18h', latency: '12ms' },
    { name: 'Job Engine', type: 'Node.js', status: 'online', uptime: '14d 2h', latency: '82ms' },
    { name: 'AI Analyzer', type: 'Python', status: 'degraded', uptime: '2h 15m', latency: '1.2s' },
    { name: 'LMS Content', type: 'Spring Boot', status: 'online', uptime: '1d 4h', latency: '15ms' },
];

const Sparkline = ({ color }: { color: string }) => (
    <svg className="h-6 w-20" viewBox="0 0 100 30">
        <path
            d="M0 25 Q 10 20, 20 28 T 40 10 T 60 22 T 80 5 T 100 18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

const ServiceBadge = ({ status }: { status: ServiceHealth['status'] }) => {
    const configs = {
        online: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Online' },
        degraded: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Degraded' },
        offline: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Offline' },
    };
    const config = configs[status];
    return (
        <span className={cn(
            "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded italic border border-white/5",
            config.bg, config.text
        )}>
            {config.label}
        </span>
    );
};

export const AdminDashboard: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 w-full pb-12"
        >
            {/* Enterprise Header Area */}
            <motion.section 
                variants={itemVariants}
                className="relative overflow-hidden p-8 md:p-12 glass-panel rounded-[2rem] border-white/10 group bg-black/40 shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-secondary)]/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="px-3 py-1 bg-[var(--color-primary)]/10 rounded-full border border-[var(--color-primary)]/30 flex items-center gap-2">
                                <Shield size={12} className="text-[var(--color-primary)]" />
                                <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest italic">Orchestrator Level 10</span>
                            </div>
                            {maintenanceMode && (
                                <div className="px-3 py-1 bg-red-500/10 rounded-full border border-red-500/30 flex items-center gap-2 animate-pulse">
                                    <Activity size={12} className="text-red-400" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest italic">Maintenance Active</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <Typography variant="h1" className="text-white">
                                Admin Control_
                            </Typography>
                            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                                Directing global microservices. The platform is currently operating at 
                                <span className="text-[var(--color-secondary)] font-black ml-2 bg-[var(--color-secondary)]/10 px-2 py-0.5 rounded italic">99.98% Efficiency</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <Button 
                            variant="primary" 
                            size="lg"
                            className="flex-1 lg:flex-none"
                        >
                            <Share2 size={18} className="mr-2" />
                            Global Broadcast
                        </Button>
                        <button 
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={cn(
                                "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border flex items-center gap-2",
                                maintenanceMode 
                                    ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            )}
                        >
                            <Wrench size={18} />
                            {maintenanceMode ? 'Disable Maint' : 'Enter Maint Mode'}
                        </button>
                    </div>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Metrics & Cluster (8 cols) */}
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MOCK_METRICS.map((m) => (
                            <motion.div 
                                key={m.label} 
                                variants={itemVariants}
                                className="glass-panel p-6 rounded-3xl border-white/5 hover:border-[var(--color-secondary)]/20 transition-all group/card bg-black/40 shadow-xl"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{m.label}</div>
                                    <Sparkline color={m.color} />
                                </div>
                                <div className="text-2xl font-black text-white italic tracking-tighter">{m.value}</div>
                                <div className="text-[10px] font-black text-emerald-400 mt-2 flex items-center gap-1 uppercase tracking-widest italic">
                                    <TrendingUp size={12} /> {m.trend}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Service Table */}
                    <motion.section variants={itemVariants} className="glass-panel rounded-[2rem] border-white/5 overflow-hidden bg-black/40 shadow-xl">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap className="text-[var(--color-secondary)]" size={20} />
                                <Typography variant="h3">Microservice Cluster</Typography>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[10px] font-black italic uppercase tracking-widest">
                                Sync Cluster_
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--color-primary)]/5">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">Service</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">Stack</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5">Uptime</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5 text-right">Latency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {MOCK_SERVICES.map((srv) => (
                                        <tr key={srv.name} className="hover:bg-white/5 transition-all group cursor-pointer">
                                            <td className="px-8 py-4 text-sm font-black text-white italic group-hover:text-[var(--color-secondary)] transition-colors">{srv.name}</td>
                                            <td className="px-8 py-4 text-[10px] font-black text-slate-500 italic uppercase tracking-widest">{srv.type}</td>
                                            <td className="px-8 py-4">
                                                <ServiceBadge status={srv.status} />
                                            </td>
                                            <td className="px-8 py-4 text-xs text-slate-400 font-medium italic">{srv.uptime}</td>
                                            <td className="px-8 py-4 text-right text-xs font-black text-emerald-400 italic tracking-tight">{srv.latency}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                </div>

                {/* Right: Actions (4 cols) */}
                <div className="xl:col-span-4 space-y-8">
                    
                    {/* Critical Pulse */}
                    <motion.section variants={itemVariants} className="glass-panel p-8 rounded-[2rem] border-red-500/20 bg-red-500/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transform group-hover:rotate-12 transition-transform duration-700">
                            <Activity size={120} className="text-red-500" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Activity size={20} className="text-red-500" />
                                <Typography variant="h3">Critical Signals</Typography>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/alert">
                                    <p className="text-xs font-black text-white uppercase italic tracking-widest mb-1 group-hover/alert:text-red-400">Enterprise Sync Fail</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">7 nodes reported latency sweep (Pending 14h).</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/alert">
                                    <p className="text-xs font-black text-white uppercase italic tracking-widest mb-1 group-hover/alert:text-red-400">Security Pulse</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Unknown protocol attempt blocked in EU-WEST-1.</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10 italic uppercase font-black text-[10px] tracking-widest">
                                Open Audit Console_
                            </Button>
                        </div>
                    </motion.section>

                    {/* Quick Control Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Activity, label: 'Protocols', path: '/admin/users', color: 'text-[var(--color-secondary)]' },
                            { icon: Shield, label: 'Security', path: '/admin/security', color: 'text-[var(--color-primary)]' },
                            { icon: Database, label: 'Bases', path: '/admin/backups', color: 'text-emerald-400' },
                            { icon: Settings, label: 'Ops', path: '/admin/settings', color: 'text-amber-400' },
                        ].map((node) => (
                            <motion.button 
                                key={node.label}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-white/20 transition-all group flex flex-col items-center gap-4 text-center bg-black/40 shadow-xl"
                            >
                                <div className={cn("p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors", node.color)}>
                                    <node.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-white transition-colors leading-tight">{node.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

