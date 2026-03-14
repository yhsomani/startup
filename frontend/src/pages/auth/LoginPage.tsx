import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Rocket,
    ArrowRight,
    Chrome,
    Eye,
    EyeOff,
    Lock,
    Quote,
    Globe,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/atoms/Button';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/v1/auth/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                login(response.data.token, response.data.refreshToken, response.data.user);
                navigate('/');
            } else {
                setError(response.data.message || 'Authentication Protocol Failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Neural Link Error: Connection Refused');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[var(--space-bg)] relative overflow-hidden flex flex-col lg:flex-row">
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-secondary)]/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff0a 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Left Side: Cinematic Narrative */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex flex-col justify-between w-[42%] p-24 relative z-10 border-r border-white/5 bg-black/60 backdrop-blur-3xl"
            >
                <div>
                    <div className="flex items-center gap-5 mb-24 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px] group-hover:rotate-12 transition-transform duration-700 shadow-[0_0_40px_var(--color-primary-glow)]">
                            <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                                <Rocket className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black italic text-3xl tracking-tighter uppercase leading-none">TalentSphere_</span>
                            <span className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">Universal Registry v4.0</span>
                        </div>
                    </div>

                    <div className="space-y-16">
                        <div className="space-y-8">
                            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-3">
                                <div className="size-2 rounded-full bg-[var(--color-secondary)] animate-ping" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Access Protocol: Established</span>
                            </div>
                            <h1 className="text-8xl leading-[0.9] text-white font-black italic tracking-tighter">
                                BRIDGE THE <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary)]">NEURAL GAP_</span>
                            </h1>
                            <p className="text-slate-400 text-xl font-medium italic max-w-md leading-relaxed">
                                Initialize your core signature and synchronize with the high-affinity recruitment matrix.
                            </p>
                        </div>

                        <div className="p-10 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm max-w-sm relative group">
                            <div className="absolute -top-4 -left-4 size-12 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center rotate-[-10deg] shadow-2xl">
                                <Quote className="text-white w-6 h-6" />
                            </div>
                            <p className="text-white text-2xl italic font-black leading-tight mb-8 group-hover:text-[var(--color-secondary)] transition-colors duration-500">
                                "The most cinematic hiring experience I've encountered."
                            </p>
                            <div className="flex items-center gap-5">
                                <div className="size-14 rounded-2xl bg-white/10 border border-white/10 p-1">
                                     <div className="w-full h-full rounded-xl bg-slate-900 overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950" />
                                     </div>
                                </div>
                                <div>
                                    <p className="text-white font-black italic uppercase text-xs tracking-widest">Arjun Sharma_</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Lead Architect @ Nexus Node</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-12">
                    {[
                        { icon: Globe, label: 'Global Mesh' },
                        { icon: ShieldCheck, label: 'Secure Signal' },
                        { icon: Zap, label: 'Neural Sync' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group/nav hover:translate-y-[-2px] transition-transform">
                            <item.icon size={20} className="text-[var(--color-secondary)] opacity-60 group-hover/nav:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black text-slate-400 group-hover/nav:text-white uppercase tracking-[0.2em] italic transition-colors">{item.label}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Right Side: Auth Interface */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 relative z-10 bg-black/20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full max-w-md space-y-12"
                >
                    <div className="text-center lg:text-left space-y-5">
                        <div className="flex items-center gap-4 lg:justify-start justify-center">
                            <div className="h-px w-8 bg-[var(--color-primary)]" />
                            <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.5em] italic">Access Authorization</span>
                        </div>
                        <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase">Signal Access_</h2>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 rounded-[1.5rem] bg-rose-500/10 border border-rose-500/30 flex items-center gap-4 overflow-hidden relative group"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                            <Lock size={18} className="text-rose-500 shrink-0" />
                            <p className="text-rose-400 text-[10px] font-black italic uppercase tracking-widest">{error}</p>
                        </motion.div>
                    )}

                    <form className="space-y-10" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">User Identity (Email)_</label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-6 text-white placeholder:text-slate-800 focus:border-[var(--color-secondary)]/40 focus:bg-[var(--color-secondary)]/5 focus:ring-4 focus:ring-[var(--color-secondary)]/5 transition-all outline-none font-bold italic text-lg"
                                    placeholder="SYNC@NETWORK.IO"
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 size-2 rounded-full bg-[var(--color-secondary)] opacity-0 group-focus-within:opacity-100 shadow-[0_0_10px_var(--color-secondary)] transition-opacity" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Secure Key (Sequence)_</label>
                                <Link to="/forgot-password" className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest italic hover:text-[var(--color-secondary)] transition-colors">
                                    Lost Access?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-6 text-white placeholder:text-slate-800 focus:border-[var(--color-primary)]/40 focus:bg-[var(--color-primary)]/5 focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all outline-none font-bold italic text-lg tracking-widest"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            fullWidth
                            className="h-24 rounded-[2.5rem] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-secondary)] text-white text-lg font-black italic uppercase tracking-[0.3em] shadow-[0_20px_50px_var(--color-primary-glow)] hover:shadow-[0_20px_60px_var(--color-secondary-glow)] hover:translate-y-[-4px] active:translate-y-[0px] transition-all disabled:opacity-50 overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 flex items-center gap-4">
                                {isLoading ? 'AUTHORIZING...' : 'INITIALIZE SIGNAL'}
                                {!isLoading && <ArrowRight size={24} className="group-hover/btn:translate-x-2 transition-transform" />}
                            </span>
                        </Button>
                    </form>

                    <div className="space-y-12">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] italic text-slate-700">
                                <span className="bg-[var(--space-bg)] px-6">Cross-Mesh Connection</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 h-18 py-4 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-[10px] font-black italic uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all flex items-center justify-center gap-4 group/social">
                                <Chrome size={20} className="text-[var(--color-secondary)] group-hover/social:scale-125 transition-transform" /> GOOGLE SYNC
                            </button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-slate-500 text-xs font-medium italic">
                                Domain unverified?
                                <Link to="/register" className="ml-4 text-white font-black uppercase tracking-[0.2em] border-b-2 border-white/10 hover:border-[var(--color-secondary)] transition-all pb-2">
                                    REGISTER NODE_
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Ambient Elements: Sensory Signals */}
            <div className="absolute top-[20%] right-[15%] size-1 bg-[var(--color-secondary)] rounded-full shadow-[0_0_20px_var(--color-secondary)] animate-ping" />
            <div className="absolute bottom-[20%] left-[60%] size-2 bg-[var(--color-primary)] rounded-full shadow-[0_0_25px_var(--color-primary)] animate-pulse" />
        </div>
    );
};



