import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiArrowRight, FiAward, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/forgotpassword', data);
            setSent(true);
            toast.success('Reset link sent to your email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
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

                        {!sent ? (
                            <>
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">Forgot Password</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Enter your institutional email to <br /> receive a reset link
                                </p>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                                    <FiCheckCircle />
                                </div>
                                <h2 className="text-xl font-black text-slate-900">Email Sent!</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Please check your inbox <br /> for instructions
                                </p>
                            </div>
                        )}
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
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
                                {errors.email && <p className="text-rose-500 text-[10px] font-black mt-1 ml-1 uppercase">{errors.email.message}</p>}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-[1.25rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 bg-slate-900 text-white hover:bg-slate-800 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : <>Get Reset Link <FiArrowRight /></>}
                            </motion.button>
                        </form>
                    ) : (
                        <Link to="/login" className="block w-full text-center py-5 bg-slate-100/50 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                            Back to Sign In
                        </Link>
                    )}

                    {!sent && (
                        <div className="mt-8 text-center">
                            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">
                                Wait, I remember now
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
