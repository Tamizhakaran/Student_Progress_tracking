import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiAward } from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';

const Login = ({ isAdmin = false }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [recall, setRecall] = useState(false);

    const onSubmit = async (data) => {
        console.log("Login clicked", data.email);
        setLoading(true);
        const user = await login(data.email, data.password);
        if (user) {
            if (user.role?.toLowerCase() === 'admin') {
                navigate('/students');
            } else {
                navigate('/dashboard');
            }
        }
        setLoading(false);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-50 mesh-gradient">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] bg-indigo-200/30"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -30, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] bg-purple-200/30"
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[420px] rounded-[2.5rem] overflow-hidden relative z-10 glass-morphism shadow-[0_40px_130px_-20px_rgba(0,0,0,0.1)] border border-white"
            >
                <div className="p-8 md:p-11 relative">
                    <motion.div variants={itemVariants} className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className="text-2xl font-black tracking-tight text-slate-900">StudentIQ</span>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">
                                {isAdmin ? 'Admin Dashboard' : 'Student Login'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Please sign in to continue
                            </p>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FiMail size={16} />
                                </div>
                                <input
                                    {...register('email', {
                                        required: 'Required',
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@bitsathy\.ac\.in$/,
                                            message: 'Valid @bitsathy.ac.in only'
                                        }
                                    })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/40 border-slate-200/20 text-slate-800 focus:bg-white focus:border-indigo-100 shadow-sm outline-none border-2"
                                    placeholder="your-id@bitsathy.ac.in"
                                />
                            </div>
                            {errors.email && <p className="text-rose-500 text-[10px] font-black mt-1 ml-1 uppercase letter-spacing-widest">{errors.email.message}</p>}
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password"
                                    {...register('password', { required: 'Required' })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/40 border-slate-200/20 text-slate-800 focus:bg-white focus:border-indigo-100 shadow-sm outline-none border-2"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-rose-500 text-[10px] font-black mt-1 ml-1 uppercase letter-spacing-widest">{errors.password.message}</p>}
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-between px-1 scale-95 origin-left">
                            <button
                                type="button"
                                onClick={() => setRecall(!recall)}
                                className="flex items-center gap-3 group"
                            >
                                <div className={`w-9 h-5 rounded-full p-1 transition-all duration-500 ${recall ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                    <motion.div
                                        animate={{ x: recall ? 16 : 0 }}
                                        className="w-3 h-3 rounded-full shadow-lg bg-white"
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest transition-colors text-slate-400 group-hover:text-slate-600">Remember Me</span>
                            </button>
                            <Link to="/forgot-password" size="xs" className="text-[10px] font-black uppercase tracking-widest transition-all text-indigo-600 hover:text-indigo-800">Forgot Password?</Link>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-[1.25rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4 text-[11px] uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 shadow-indigo-200/50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                            ) : (
                                <>
                                    {isAdmin ? 'Login as Admin' : 'Sign In'} <FiArrowRight className="text-base" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-10 text-center space-y-6">
                        <p className="text-[11px] font-bold text-slate-400 tracking-tight italic">
                            Contact Admin if you don't have an account
                        </p>
                        <div className="pt-6 border-t border-slate-100">
                            {isAdmin ? (
                                <Link to="/login" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:animate-ping" />
                                    Student Login
                                </Link>
                            ) : (
                                <Link to="/admin/login" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-600 group-hover:animate-ping" />
                                    Administrative Console
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
