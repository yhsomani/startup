import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, KeyRound, Eye, EyeOff, ArrowLeft, 
    CheckCircle, Globe, Zap, ShieldAlert,
    RefreshCw, Lock, Signal, Layers
} from 'lucide-react';
import { useToast } from '../../components/organisms/Toast';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';

type Step = 'email' | 'otp' | 'password' | 'done';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/api/v1/auth/forgot-password', { email });
            setStep('otp');
            addToast({ type: 'success', title: 'Signal Transmitted', message: `Recovery sequence sent to ${email}.` });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Signal Interruption: Unable to transmit recovery sequence.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Protocol Error: Complete 6-digit sequence required.'); return; }
        setError(''); setIsLoading(true);
        try {
            await api.post('/api/v1/auth/verify-otp', { email, otp: code });
            setStep('password');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification Failed: Invalid sequence detected.');
        } finally { setIsLoading(false); }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError('Neural Drift: Keys do not match.'); return; }
        if (password.length < 8) { setError('Protocol Error: Key must be 8+ symbols.'); return; }
        setError(''); setIsLoading(true);
        try {
            await api.post('/api/v1/auth/reset-password', { email, otp: otp.join(''), newPassword: password });
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Access Protocol Update Failed.');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen w-full bg-[var(--space-bg)] relative overflow-hidden flex flex-col lg:flex-row">
            {/* Background Narrative Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-[var(--color-primary)]/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            
            {/* Left Side: Cinematic Narrative */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-between w-[40%] p-20 relative z-10 border-r border-white/5 bg-black/40 backdrop-blur-3xl"
            >
                <div className="space-y-12">
                    <div className="flex items-center gap-4 mb-20 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] shadow-[0_0_30px_var(--color-secondary-glow)]">
                            <Layers className="text-white w-6 h-6" />
                        </div>
                        <Typography variant="h1" className="text-2xl mb-0 italic tracking-tighter text-white">TalentSphere_</Typography>
                    </div>

                    <div className="space-y-8">
                        <div className="px-4 py-1 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5 inline-flex items-center gap-2">
                            <Signal size={14} className="text-[var(--color-secondary)] animate-pulse" />
                            <span className="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-[0.3em] italic">Signal Recovery</span>
                        </div>
                        <Typography variant="h1" className="text-6xl leading-tight text-white mb-4">
                            Restore Your <br /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)]">Neural Access_</span>
                        </Typography>
                        <p className="text-slate-400 text-lg font-medium italic max-w-sm leading-relaxed">
                            Initialize the identity verification protocol to regain entry into the unified global workforce matrix.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { icon: Lock, text: 'Tier 1 Security Encryption' },
                            { icon: Zap, text: 'Instant Validation Pulse' },
                            { icon: Globe, text: 'Cross-Node Identity Sync' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 text-[var(--color-primary)]">
                                <item.icon size={20} className="opacity-60" />
                                <span className="text-xs font-black uppercase tracking-widest italic text-slate-300">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 glass-panel rounded-[2rem] border-white/10 bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black italic text-white">SR</div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Status: Locked</p>
                            <p className="text-xs font-black text-white italic mt-1">Recovery sequence pending_</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Recovery Interface */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar p-8 lg:p-20 relative z-10 w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl space-y-12"
                >
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-black italic uppercase tracking-widest text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <motion.div 
                                key="email"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2 text-center lg:text-left">
                                    <Typography variant="h2" className="text-white text-4xl mb-0 italic">Initialize_</Typography>
                                    <p className="text-slate-500 font-medium italic uppercase tracking-widest text-[10px]">Configure Signal Parameters</p>
                                </div>

                                <form className="space-y-8" onSubmit={handleEmailSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Signal Address (Email)_</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-secondary)] w-5 h-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                                            <input 
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-8 text-white focus:border-[var(--color-secondary)]/40 transition-all outline-none font-bold italic"
                                                placeholder="NODE@NETWORK.IO"
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={isLoading}
                                        fullWidth
                                        size="lg"
                                        className="h-20 rounded-[2rem] bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] text-white text-xs font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_var(--color-secondary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {isLoading ? 'TRANSMITTING...' : 'INITIATE RECOVERY'}
                                        {!isLoading && <RefreshCw size={18} className="ml-4" />}
                                    </Button>
                                </form>

                                <button onClick={() => navigate('/login')} className="w-full text-center text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest italic transition-all">
                                    ← ABORT SEQUENCE: BACK TO LOGIN
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: OTP */}
                        {step === 'otp' && (
                            <motion.div 
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2 text-center lg:text-left">
                                    <Typography variant="h2" className="text-white text-4xl mb-0 italic">Authenticate_</Typography>
                                    <p className="text-slate-500 font-medium italic uppercase tracking-widest text-[10px]">Input Core Validation Key</p>
                                </div>

                                <form className="space-y-10" onSubmit={handleOtpSubmit}>
                                    <div className="flex justify-between gap-4">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                id={`otp-${i}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={e => handleOtpChange(i, e.target.value)}
                                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                                className="w-16 h-24 bg-black/40 border border-white/5 rounded-[1.5rem] text-center text-3xl font-black text-[var(--color-secondary)] focus:border-[var(--color-secondary)]/60 focus:ring-4 focus:ring-[var(--color-secondary)]/5 transition-all outline-none italic shadow-[0_0_20px_var(--color-secondary-glow/10)]"
                                            />
                                        ))}
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={isLoading}
                                        fullWidth
                                        size="lg"
                                        className="h-20 rounded-[2rem] bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] text-white text-xs font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_var(--color-secondary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {isLoading ? 'VALIDATING...' : 'AUTHORIZE IDENTITY'}
                                        {!isLoading && <ShieldAlert size={18} className="ml-4" />}
                                    </Button>
                                </form>

                                <button onClick={() => setStep('email')} className="w-full text-center text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest italic transition-all">
                                    ← RECONFIGURE SIGNAL ADDRESS
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Password */}
                        {step === 'password' && (
                            <motion.div 
                                key="password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2 text-center lg:text-left">
                                    <Typography variant="h2" className="text-white text-4xl mb-0 italic">Synchronize_</Typography>
                                    <p className="text-slate-500 font-medium italic uppercase tracking-widest text-[10px]">Establish New Security Coordinates</p>
                                </div>

                                <form className="space-y-8" onSubmit={handlePasswordSubmit}>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">New Access Key_</label>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-secondary)] w-5 h-5 opacity-40 group-focus-within:opacity-100" />
                                                <input 
                                                    required
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-16 text-white focus:border-[var(--color-secondary)]/40 transition-all outline-none font-bold italic"
                                                    placeholder="••••••••"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic ml-6">Verify Access Key_</label>
                                            <input 
                                                required
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 px-8 text-white focus:border-[var(--color-secondary)]/30 transition-all outline-none font-bold italic"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={isLoading}
                                        fullWidth
                                        size="lg"
                                        className="h-20 rounded-[2rem] bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] text-white text-xs font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_var(--color-secondary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {isLoading ? 'RESOLVING...' : 'SYNCHRONIZE NEW KEY'}
                                        {!isLoading && <Lock size={18} className="ml-4" />}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 4: Done */}
                        {step === 'done' && (
                            <motion.div 
                                key="done"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-10"
                            >
                                <div className="size-20 bg-[var(--color-secondary)]/10 rounded-[1.5rem] border border-[var(--color-secondary)]/20 flex items-center justify-center mx-auto shadow-[0_0_40px_var(--color-secondary-glow/20)]">
                                    <CheckCircle size={40} className="text-[var(--color-secondary)]" />
                                </div>
                                <div className="space-y-4">
                                    <Typography variant="h2" className="text-white text-4xl mb-0 italic">Sync Successful_</Typography>
                                    <p className="text-slate-500 text-sm font-medium italic leading-relaxed">
                                        Your neural identity has been updated with the new security sequence. Access protocols are now fully operational.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => navigate('/login')}
                                    fullWidth
                                    size="lg"
                                    className="h-20 rounded-[2rem] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white text-xs font-black italic uppercase tracking-[0.2em] shadow-[0_20px_40px_var(--color-primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    INITIALIZE LOGIN
                                    <ArrowLeft size={18} className="ml-4 rotate-180" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

