import { motion } from 'framer-motion';
import { LuSettings, LuHammer, LuClock } from 'react-icons/lu';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl w-full text-center relative z-10"
            >
                {/* Visual Icon */}
                <div className="relative inline-block mb-12">
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-32 h-32 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 transform -rotate-3 hover:rotate-0 transition-transform cursor-default"
                    >
                        <LuHammer className="text-5xl" />
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12"
                    >
                        <LuSettings className="text-2xl animate-spin-slow" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <motion.h1
                    className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter mb-6 leading-tight"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Enhancing Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Learning Experience</span>
                </motion.h1>

                <motion.p
                    className="text-lg text-slate-500 font-bold mb-12 max-w-lg mx-auto leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Currently the page is not available. It's under maintenance for improvements. We'll be back shortly with a smoother, faster StudentIQ!
                </motion.p>

                {/* Info Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="glass-morphism p-6 rounded-3xl border-slate-200/50 bg-white/40 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <LuClock className="text-xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Time</p>
                            <p className="font-bold text-slate-950">~ 2 Hours</p>
                        </div>
                    </div>

                    <div className="glass-morphism p-6 rounded-3xl border-slate-200/50 bg-white/40 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <LuSettings className="text-xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                            <p className="font-bold text-slate-950">System Optimization</p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Message */}
                <motion.p
                    className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    Thank you for your patience
                </motion.p>
            </motion.div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
