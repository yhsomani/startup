import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Eye, EyeOff, Layers, Code, UserSearch, X, Rocket, 
    ShieldCheck, Zap, Globe, Sparkles, Orbit, Lock,
    CheckCircle2, ArrowRight, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';
import { cn } from '../../utils/cn';

export const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userType, setUserType] = useState<'developer' | 'recruiter'>('developer');
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError("Neural Signal Drift: Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/v1/auth/register', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: userType.toUpperCase()
            });

            if (response.data.success || response.status === 201) {
                if (response.data.token) {
                    login(response.data.token, response.data.refreshToken, response.data.user);
                    navigate('/');
                } else {
                    navigate('/login');
                }
            } else {
                setError(response.data.message || 'Initialization Failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Access Protocol Error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050510] relative overflow-hidden flex flex-col lg:flex-row">
            {/* Background Narrative Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8c25f4 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-[#8c25f4]/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            
            {/* Left Side: Cinematic Narrative */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-between w-[40%] p-20 relative z-10 border-r border-white/5 bg-black/40 backdrop-blur-3xl"
            >
                <div className="space-y-12">
                    <div className="flex items-center gap-4 mb-20 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#13ecec] to-[#8c25f4] shadow-[0_0_30px_rgba(19,236,236,0.2)]">
                            <Layers className="text-white w-6 h-6" />
                        </div>
                        <Typography variant="h1" className="text-2xl mb-0 italic tracking-tighter text-white">TalentSphere_</Typography>
                    </div>

                    <div className="space-y-8">
                        <div className="px-4 py-1 rounded-full border border-[#8c25f4]/30 bg-[#8c25f4]/5 inline-flex items-center gap-2">
                            <Orbit size={14} className="text-[#8c25f4] animate-spin-slow" />
                            <span className="text-[10px] font-black text-[#8c25f4] uppercase tracking-[0.3em] italic">Mesh Initialization</span>
                        </div>
                        <Typography variant="h1" className="text-6xl leading-tight text-white mb-4">
                            Define your <br /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#13ecec] to-[#8c25f4]">Neural Signature_</span>
                        </Typography>
                        <p className="text-slate-400 text-lg font-medium italic max-w-sm leading-relaxed">
                            Join the unified global workforce matrix and unlock high-affinity opportunities tailored to your core essence.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { icon: CheckCircle2, text: 'Tier 1 Intelligence Integration' },
                            { icon: CheckCircle2, text: 'Neural Resume Synthesis' },
                            { icon: CheckCircle2, text: 'Real-time Pipeline Sync' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 text-[#13ecec]">
                                <item.icon size={20} className="opacity-60" />
                                <span className="text-xs font-black uppercase tracking-widest italic text-slate-300">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 glass-panel rounded-[2rem] border-white/10 bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-gradient-to-br from-[#13ecec] to-[#8c25f4] p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black italic text-white">TS</div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Global Network</p>
                            <p className="text-xs font-black text-white italic mt-1">12,402 Active Nodes_</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Registration Interface */}
            <div className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar p-8 lg:p-20 relative z-10 w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl space-y-12"
                >
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                        <div className="space-y-2">
                            <Typography variant="h2" className="text-white text-4xl mb-0 italic">Mesh Entry Request_</Typography>
                            <p className="text-slate-500 font-medium italic">CONFIGURE CORE IDENTITY PARAMETERS</p>
                        </div>
                        <Link to="/login" className="text-[10px] font-black text-[#8c25f4] hover:text-[#13ecec] uppercase tracking-widest italic border-b border-[#8c25f4]/30 pb-1 transition-all">
                            Exist in Matrix? Login_
                        </Link>
                    </div>

                    {error && (
                        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black italic uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    {/* Protocol Selector */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-4">Select Engagement Protocol_</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <button 
                                onClick={() => setUserType('developer')}
                                className={cn(
                                    "p-8 rounded-[2rem] glass-panel border transition-all text-left flex items-start gap-6 group",
                                    userType === 'developer' 
                                        ? "border-[#13ecec]/40 bg-[#13ecec]/5 ring-4 ring-[#13ecec]/5" 
                                        : "border-white/5 bg-black/40 hover:border-white/20"
                                )}
                            >
                                <div className={cn("p-4 rounded-2xl transition-colors", userType === 'developer' ? "bg-[#13ecec] text-black" : "bg-white/5 text-slate-500 group-hover:text-white")}>
                                    <Code size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={cn("font-black italic text-lg transition-colors", userType === 'developer' ? "text-[#13ecec]" : "text-white")}>Developer_</h3>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Signal Integration</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setUserType('recruiter')}
                                className={cn(
                                    "p-8 rounded-[2rem] glass-panel border transition-all text-left flex items-start gap-6 group",
                                    userType === 'recruiter' 
                                        ? "border-[#8c25f4]/40 bg-[#8c25f4]/5 ring-4 ring-[#8c25f4]/5" 
                                        : "border-white/5 bg-black/40 hover:border-white/20"
                                )}
                            >
                                <div className={cn("p-4 rounded-2xl transition-colors", userType === 'recruiter' ? "bg-[#8c25f4] text-white" : "bg-white/5 text-slate-500 group-hover:text-white")}>
                                    <UserSearch size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={cn("font-black italic text-lg transition-colors", userType === 'recruiter' ? "text-[#8c25f4]" : "text-white")}>Recruiter_</h3>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Acquisition Sync</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <form className="space-y-10" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">First Name_</label>
                                <input 
                                    required
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white placeholder:text-slate-900 focus:border-white/20 transition-all outline-none font-bold italic"
                                    placeholder="ALEX"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Last Name_</label>
                                <input 
                                    required
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white placeholder:text-slate-900 focus:border-white/20 transition-all outline-none font-bold italic"
                                    placeholder="MORGAN"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Signal Address (Email)_</label>
                            <input 
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white placeholder:text-slate-900 focus:border-white/20 transition-all outline-none font-bold italic"
                                placeholder="ALEX@MATRIX.SYSTEM"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Access Key_</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white focus:border-white/20 transition-all outline-none font-bold italic"
                                        placeholder="••••••••"
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)} type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Verify Key_</label>
                                <input 
                                    required
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white focus:border-white/20 transition-all outline-none font-bold italic"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                fullWidth
                                size="lg"
                                className="h-20 rounded-[2rem] bg-gradient-to-r from-[#13ecec] to-[#8c25f4] text-white text-sm font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(19,236,236,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'SYNCHRONIZING CORE...' : 'ESTABLISH NEURAL IDENTITY'}
                                {!isLoading && <UserPlus size={20} className="ml-4" />}
                            </Button>
                        </div>
                    </form>

                    <p className="text-center text-[10px] font-black italic text-slate-700 uppercase tracking-[0.3em]">
                        By initializing, you agree to the <span className="text-white hover:text-[#13ecec] cursor-pointer transition-colors">Mesh Protocols</span> & <span className="text-white hover:text-[#13ecec] cursor-pointer transition-colors">Privacy Synthesis</span>.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
