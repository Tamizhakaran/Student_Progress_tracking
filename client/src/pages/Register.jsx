import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiAward } from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import { DEPARTMENTS } from '../utils/constants';

const Register = () => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: { role: 'Student' }
    });
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const selectedRole = watch('role');

    const onSubmit = async (data) => {
        setLoading(true);
        const success = await registerUser(data);
        if (success) {
            navigate('/login');
        }
        setLoading(false);
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-50 mesh-gradient">
            {/* Background Effects */}
            <div className="absolute inset-0 grid-bg-overlay opacity-40"></div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-indigo-500/10"
                />
                <motion.div
                    animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-purple-500/10"
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-5xl rounded-[3rem] overflow-hidden relative z-10 glass-morphism shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row min-h-[700px] border border-white transition-all duration-700"
            >
                {/* Visual Branding Section */}
                <div className="lg:w-5/12 p-12 lg:p-16 flex flex-col justify-between relative transition-colors duration-700 bg-indigo-600 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

                    <div className="relative z-10">
                        <Link to="/" className="flex items-center gap-3 mb-12 group inline-flex">
                            <motion.div whileHover={{ rotate: 5, scale: 1.1 }} className="w-9 h-9 bg-white text-slate-950 rounded-xl flex items-center justify-center shadow-2xl">
                                <LuGraduationCap className="text-xl" />
                            </motion.div>
                            <span className="text-xl font-black tracking-tight text-white">StudentIQ</span>
                        </Link>

                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                                Start your <br />
                                <span className="text-indigo-400">Account.</span>
                            </h1>
                            <p className="text-white/70 font-bold text-sm max-w-xs leading-relaxed">
                                Join the next generation of academic intelligence and track your trajectory with precision.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-indigo-800 flex items-center justify-center text-[10px] font-black text-white">X</div>
                                ))}
                            </div>
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Trusted by 2k+ Researchers</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="flex-1 p-8 lg:p-14 bg-white">
                    <div className="mb-10">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8">
                            {selectedRole === 'Admin' ? 'Admin Registration' : 'Student Sign Up'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Full Name</label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-400 group-focus-within:text-indigo-600" />
                                    <input
                                        {...register('name', { required: 'Required' })}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 border-transparent focus:bg-white"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Email Address</label>
                                <div className="relative group">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-400 group-focus-within:text-indigo-600" />
                                    <input
                                        {...register('email', {
                                            required: 'Required',
                                            pattern: { value: /^[a-zA-Z0-9._%+-]+@bitsathy\.ac\.in$/, message: '@bitsathy.ac.in only' }
                                        })}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 border-transparent focus:bg-white"
                                        placeholder="your-id@bitsathy.ac.in"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Role</label>
                                <select
                                    {...register('role', { required: true })}
                                    className="w-full px-5 py-3.5 rounded-2xl transition-all font-black text-sm outline-none appearance-none cursor-pointer border-2 bg-slate-100/30 border-transparent"
                                >
                                    <option value="Student">Active Student</option>
                                    <option value="Admin">System Administrator</option>
                                </select>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">
                                    {selectedRole === 'Student' ? 'Enrollment ID' : 'Access Code'}
                                </label>
                                <input
                                    {...register(selectedRole === 'Student' ? 'registerNumber' : 'schoolId', { required: 'Required' })}
                                    className="w-full px-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 border-transparent focus:bg-white"
                                    placeholder={selectedRole === 'Student' ? "7376xxxxx" : "ADM-xxxx"}
                                />
                            </motion.div>
                        </div>

                        {selectedRole === 'Student' && (
                            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6 pb-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Branch</label>
                                    <select
                                        {...register('department')}
                                        className="w-full px-5 py-3 rounded-xl bg-slate-100/30 border-2 border-transparent focus:bg-white transition-all font-black text-[12px] outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">Select Branch</option>
                                        {DEPARTMENTS.map((dept) => (
                                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Semester</label>
                                    <select
                                        {...register('semester')}
                                        className="w-full px-5 py-3 rounded-xl bg-slate-100/30 border-2 border-transparent focus:bg-white transition-all font-black text-[12px] outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Security Key</label>
                                <div className="relative group">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-400 group-focus-within:text-indigo-600" />
                                    <input
                                        type="password"
                                        {...register('password', { required: 'Required', minLength: 6 })}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 border-transparent focus:bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Confirm Password</label>
                                <div className="relative group">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-slate-400 group-focus-within:text-indigo-600" />
                                    <input
                                        type="password"
                                        {...register('confirmPassword', {
                                            required: 'Required',
                                            validate: (v) => v === watch('password') || 'No Match'
                                        })}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 border-transparent focus:bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-[1.25rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 mt-4 uppercase tracking-[0.2em] text-[11px] bg-slate-950 text-white"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                            ) : (
                                <>
                                    {selectedRole === 'Admin' ? 'Register Admin' : 'Create Account'} <FiArrowRight className="text-base" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-10 text-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-black hover:underline underline-offset-4 decoration-2">
                                Sign In
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
