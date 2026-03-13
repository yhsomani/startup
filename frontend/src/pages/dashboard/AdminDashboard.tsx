import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    { label: 'CPU Usage', value: '42%', status: 'optimal', trend: '+2% from last hr', color: '#13ecec' },
    { label: 'Memory', value: '7.8GB', status: 'optimal', trend: 'Stable', color: '#10b981' },
    { label: 'API Latency', value: '124ms', status: 'optimal', trend: '-12ms', color: '#8b5cf6' },
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
            strokeWidth="2"
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
        <span className={`px-2 py-0.5 ${config.bg} ${config.text} text-[10px] font-black uppercase tracking-widest rounded`}>
            {config.label}
        </span>
    );
};

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    return (
        <div className="flex flex-col gap-6 w-full font-sans text-slate-100 p-2 sm:p-0">
            {/* Enterprise Header */}
            <header className="relative overflow-hidden p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-purple-500/30">
                                System Orchestrator
                            </span>
                            {maintenanceMode && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-500/30 animate-pulse">
                                    Maintenance Active
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Admin Control Center</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-md">
                            Monitor platform health, manage microservices, and oversee global talent operations.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${maintenanceMode ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-lg align-middle mr-2">engineering</span>
                            {maintenanceMode ? 'Disable Maint Mode' : 'Enter Maint Mode'}
                        </button>
                        <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transform hover:-translate-y-1 transition-all">
                            Global Broadcast
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left: System Health & Metrics (8 cols) */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    
                    {/* Metrics Grid */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MOCK_METRICS.map((m) => (
                            <div key={m.label} className="bg-slate-900/60 backdrop-blur-lg p-5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                                    <Sparkline color={m.color} />
                                </div>
                                <div className="text-2xl font-black text-white">{m.value}</div>
                                <div className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                                    <span className="material-symbols-outlined text-xs">trending_up</span> {m.trend}
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Service Orchestration Table */}
                    <section className="bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-cyan-400">hub</span>
                                Microservice Cluster
                            </h3>
                            <button className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Refresh Cluster Status</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Service Name</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Stack</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Uptime</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Latency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_SERVICES.map((srv) => (
                                        <tr key={srv.name} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer">
                                            <td className="px-6 py-4 font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{srv.name}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tighter uppercase">{srv.type}</td>
                                            <td className="px-6 py-4">
                                                <ServiceBadge status={srv.status} />
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400 font-medium">{srv.uptime}</td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-emerald-400">{srv.latency}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right: Security & Alerts (4 cols) */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    
                    {/* Action Required Box */}
                    <section className="bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-xl p-6 rounded-3xl border border-red-500/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-red-500">warning</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-3 italic tracking-tighter">
                                <span className="material-symbols-outlined text-red-500">priority_high</span>
                                Critical Actions
                            </h3>
                            <div className="flex flex-col gap-4 mt-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                    <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Verify New Partner</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">InnovateTech LLC requested enterprise verification (Pending 14h).</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                    <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Reported Job Sweep</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">12 listings flagged for spam in the last 2 hours. Review queue active.</p>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-4 bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all">
                                Open Audit Console
                            </button>
                        </div>
                    </section>

                    {/* Quick Access Grid */}
                    <section className="grid grid-cols-2 gap-4">
                        {[
                            { icon: 'group', label: 'Users', path: '/admin/users' },
                            { icon: 'security', label: 'Permissions', path: '/admin/security' },
                            { icon: 'database', label: 'Backups', path: '/admin/backups' },
                            { icon: 'settings', label: 'Config', path: '/admin/settings' },
                        ].map((item) => (
                            <button 
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group flex flex-col items-center gap-3"
                            >
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-400 transition-colors text-2xl">{item.icon}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
                            </button>
                        ))}
                    </section>

                </div>

            </div>
        </div>
    );
};
