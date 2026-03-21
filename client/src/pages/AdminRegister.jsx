import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiShield, FiAlertCircle } from 'react-icons/fi';

const AdminRegister = () => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: { role: 'Admin' }
    });
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [regError, setRegError] = useState(null);

    const onSubmit = async (data) => {
        setLoading(true);
        setRegError(null);
        try {
            const user = await registerUser({ ...data, role: 'Admin' });
            if (user) {
                if (user.role === 'Admin') {
                    navigate('/students');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            setRegError(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans mesh-gradient">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-[1000px] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 border border-white"
            >
                {/* Left Side - Visual Content */}
                <div className="lg:w-[400px] bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <motion.div variants={itemVariants} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/10">
                            <FiShield className="text-2xl text-indigo-400" />
                        </motion.div>
                        <motion.h1 variants={itemVariants} className="text-3xl font-black tracking-tight mb-4">
                            Administrative <br />Setup
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-400 text-sm font-medium leading-relaxed">
                            Create a new system administrator account to manage the Educational Progress Tracking System.
                        </motion.p>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-white/10">
                        <div className="flex -space-x-3 mb-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Secure Team Access Only
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[60px]" />
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 p-8 lg:p-14 bg-white">
                    <div className="mb-10">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8">
                            Admin Registration
                        </h2>
                    </div>

                    {regError && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600"
                        >
                            <FiAlertCircle className="text-xl shrink-0" />
                            <p className="text-xs font-bold">{regError}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Full Name</label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        {...register('name', { required: 'Required' })}
                                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 ${errors.name ? 'border-rose-500' : 'border-transparent'} focus:bg-white focus:border-indigo-100`}
                                        placeholder="Administrator Name"
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Email Address</label>
                                <div className="relative group">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        {...register('email', {
                                            required: 'Required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@bitsathy\.ac\.in$/i,
                                                message: 'Must be @bitsathy.ac.in'
                                            }
                                        })}
                                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 ${errors.email ? 'border-rose-500' : 'border-transparent'} focus:bg-white focus:border-indigo-100`}
                                        placeholder="admin@bitsathy.ac.in"
                                    />
                                    {errors.email && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1 ml-2">{errors.email.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Password</label>
                                <div className="relative group">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="password"
                                        {...register('password', {
                                            required: 'Required',
                                            minLength: { value: 6, message: 'Min 6 characters' }
                                        })}
                                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:bg-white focus:border-indigo-100`}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1 ml-2">{errors.password.message}</p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">
                                    Admin Access Code
                                </label>
                                <div className="relative group">
                                    <input
                                        {...register('schoolId', { required: 'Required' })}
                                        className={`w-full px-5 py-3.5 rounded-2xl transition-all font-bold text-sm outline-none border-2 bg-slate-100/30 ${errors.schoolId ? 'border-rose-500' : 'border-transparent'} focus:bg-white focus:border-indigo-100`}
                                        placeholder="BIT-ADM-2026"
                                    />
                                    {errors.schoolId && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1 ml-2">{errors.schoolId.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                            ) : (
                                <>
                                    Register Admin <FiArrowRight className="text-base" />
                                </>
                            )}
                        </motion.button>

                        <motion.div variants={itemVariants} className="text-center mt-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Already have access? <Link to="/admin/login" className="text-indigo-600 hover:text-indigo-700 ml-1 transition-colors">Admin Login</Link>
                            </p>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminRegister;
