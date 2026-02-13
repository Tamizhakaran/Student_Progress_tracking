import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiArrowRight, FiAward } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.put(`/auth/resetpassword/${token}`, { password: data.password });
            toast.success('Password reset successful! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed or link expired');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-50 mesh-gradient">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[420px] rounded-[2.5rem] overflow-hidden relative z-10 glass-morphism shadow-[0_40px_130px_-20px_rgba(0,0,0,0.1)] border border-white"
            >
                <div className="p-8 md:p-11">
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-2xl">
                                <FiAward className="text-xl" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900">StudentIQ</span>
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">New Password</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Secure your account with a <br /> new security key
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">New Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password"
                                    {...register('password', {
                                        required: 'Required',
                                        minLength: { value: 6, message: 'Min 6 characters' }
                                    })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/40 border-slate-200/20 text-slate-800 focus:bg-white focus:border-indigo-100 shadow-sm outline-none border-2"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-rose-500 text-[10px] font-black mt-1 ml-1 uppercase">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Confirm Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password"
                                    {...register('confirmPassword', {
                                        required: 'Required',
                                        validate: (val) => watch('password') === val || "Passwords don't match"
                                    })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/40 border-slate-200/20 text-slate-800 focus:bg-white focus:border-indigo-100 shadow-sm outline-none border-2"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-rose-500 text-[10px] font-black mt-1 ml-1 uppercase">{errors.confirmPassword.message}</p>}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-[1.25rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 bg-slate-900 text-white hover:bg-slate-800 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : <>Update Password <FiArrowRight /></>}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
