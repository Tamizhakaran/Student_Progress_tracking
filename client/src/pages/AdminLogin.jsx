import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';

const AdminLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const success = await login(data.email, data.password);
        if (success) {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-50 mesh-gradient">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100 rounded-full blur-[140px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100 rounded-full blur-[140px] opacity-40"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] rounded-[2.5rem] overflow-hidden relative z-10 glass-morphism shadow-2xl border border-white"
            >
                <div className="p-10">
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <FiShield className="text-xl" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900">Admin Login</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Secure System Administration
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    {...register('email', { required: 'Required' })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/50 border-transparent focus:bg-white focus:border-indigo-100 outline-none border-2"
                                    placeholder="admin@bitsathy.ac.in"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    {...register('password', { required: 'Required' })}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-100/50 border-transparent focus:bg-white focus:border-indigo-100 outline-none border-2"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-[1.25rem] font-black shadow-xl transition-all flex items-center justify-center gap-4 bg-slate-900 text-white hover:bg-slate-800"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                            ) : (
                                <>Login to Dashboard <FiArrowRight /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <Link to="/login" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Student Portal
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
