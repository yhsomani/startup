import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Globe, SignalHigh, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { Typography } from '../../components/atoms/Typography';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-[#050510] relative overflow-hidden flex items-center justify-center p-8">
            {/* Background Narrative Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8c25f4 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8c25f4]/5 blur-[200px] rounded-full pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 max-w-2xl w-full text-center space-y-12"
            >
                {/* Glitch Logic: 404 */}
                <div className="relative group">
                    <motion.div 
                        animate={{ 
                            textShadow: [
                                "0 0 0px #13ecec",
                                "2px 0 10px #8c25f4",
                                "-2px 0 10px #13ecec",
                                "0 0 0px #13ecec"
                            ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[12rem] md:text-[18rem] font-black leading-none text-white/5 italic select-none tracking-tighter"
                    >
                        404
                    </motion.div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="size-32 rounded-[2rem] bg-gradient-to-br from-[#8c25f4] to-[#13ecec] p-[2px] shadow-[0_0_80px_rgba(140,37,244,0.3)]"
                        >
                            <div className="w-full h-full rounded-[1.9rem] bg-black flex items-center justify-center">
                                <AlertTriangle size={64} className="text-white animate-pulse" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <SignalHigh size={14} className="text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Signal Lost in Deep Space</span>
                    </div>
                    
                    <Typography variant="h1" className="text-white text-5xl md:text-6xl mb-0 italic">Link Terminated_</Typography>
                    <p className="text-slate-500 text-lg font-medium italic max-w-md mx-auto leading-relaxed">
                        The requested neural coordinate does not exist within the current matrix. Your connection has drifted into unmapped territory.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button
                        size="lg"
                        className="h-16 px-10 rounded-[1.5rem] bg-white text-black text-xs font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        onClick={() => navigate('/')}
                    >
                        <Home size={18} className="mr-3" /> RESTORE DASHBOARD
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-16 px-10 rounded-[1.5rem] border-white/5 bg-white/5 text-white text-xs font-black uppercase tracking-widest italic hover:bg-white/10 transition-all"
                        onClick={() => navigate(-1)}
                    >
                        <RefreshCcw size={18} className="mr-3" /> REATTEMPT SIGNAL
                    </Button>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-12 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic flex items-center justify-center gap-4"
                >
                    <Globe size={14} />
                    MATRIX_VERSION_2.0 // DEEP_SPACE_UPGRADE
                </motion.div>
            </motion.div>

            {/* Visual Flair: Floating Particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ 
                        y: [0, -100], 
                        opacity: [0, 0.5, 0],
                        x: [0, (i % 2 === 0 ? 20 : -20)]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 3 + i, 
                        delay: i * 0.5 
                    }}
                    className="absolute bottom-0 size-1 bg-[#13ecec] rounded-full blur-[2px]"
                    style={{ left: `${15 + (i * 15)}%` }}
                />
            ))}
        </div>
    );
};
