import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiAward } from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';

const Landing = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 transition-colors duration-1000 overflow-x-hidden">
            {/* Mesh Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[20%] left-[-5%] w-[50%] h-[50%] bg-purple-100/50 rounded-full blur-[120px]"></div>
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                            StudentIQ
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <Link to="/login" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black shadow-xl shadow-indigo-200 hover:scale-105 transition-all uppercase tracking-[0.2em]">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div {...fadeInUp} className="relative z-10">
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-black mb-10 uppercase tracking-[0.3em] leading-none shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Student Progress Monitor
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-10 tracking-tighter leading-[0.95]">
                            Track Your <br />
                            <span className="text-indigo-600 decoration-8 underline decoration-slate-200 underline-offset-8">Progress.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 mb-14 max-w-2xl mx-auto leading-relaxed font-bold">
                            The best way to monitor student performance and attendance.
                            Built for students and teachers at BIT Sathy.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link to="/login" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-4">
                                Student Login <FiArrowRight className="text-xl" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-200 bg-white transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex items-center gap-3">
                            <FiAward className="text-indigo-600 text-2xl" />
                            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">StudentIQ</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">© {new Date().getFullYear()} StudentIQ Global Core.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
