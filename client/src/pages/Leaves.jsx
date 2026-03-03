import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fromDate: '',
        toDate: '',
        fromTime: '',
        toTime: '',
        reason: ''
    });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves/my');
            setLeaves(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch leave history');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fromDate || !formData.toDate || !formData.fromTime || !formData.toTime || !formData.reason) {
            return toast.error('Please fill all details');
        }

        try {
            await api.post('/leaves', formData);
            toast.success('Leave application submitted');
            setIsModalOpen(false);
            setFormData({
                fromDate: '',
                toDate: '',
                fromTime: '',
                toTime: '',
                reason: ''
            });
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit application');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'Rejected': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-amber-600 bg-amber-50 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <FiCheckCircle />;
            case 'Rejected': return <FiXCircle />;
            default: return <FiClock className="animate-pulse" />;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">My <span className="text-indigo-600">Leaves</span></h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Application & History</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl shadow-slate-900/20 hover:shadow-indigo-500/40 transition-all hover:bg-slate-800"
                >
                    <FiPlus size={20} />
                    <span>Apply Leave</span>
                </motion.button>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest text-sm">
                    Loading Records...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaves.length > 0 ? leaves.map((leave) => (
                        <motion.div
                            key={leave._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                        >
                            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl border-l border-b flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${getStatusColor(leave.status)}`}>
                                {getStatusIcon(leave.status)}
                                {leave.status}
                            </div>

                            <div className="mb-6 pt-2">
                                <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 line-clamp-2 pr-20">{leave.reason}</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <FiCalendar className="text-indigo-500" />
                                        <span>{new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <FiClock className="text-indigo-500" />
                                        <span>{leave.fromTime} to {leave.toTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50/50 w-fit px-3 py-1.5 rounded-lg border border-indigo-100/50">
                                        <span>Total: {Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days</span>
                                    </div>
                                </div>
                            </div>

                            {leave.adminRemark && (
                                <div className={`p-4 rounded-2xl border text-[10px] font-bold ${leave.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-rose-50/50 border-rose-100 text-rose-700'}`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-60">
                                        <FiMessageSquare />
                                        <span className="uppercase tracking-[0.15em]">Admin Remark</span>
                                    </div>
                                    <p className="leading-relaxed">{leave.adminRemark}</p>
                                </div>
                            )}
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs">
                            No leave history found
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-8 md:p-12"
                        >
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Apply for Leave</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">From Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fromDate}
                                            onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">To Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.toDate}
                                            onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">From Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.fromTime}
                                            onChange={e => setFormData({ ...formData, fromTime: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">To Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.toTime}
                                            onChange={e => setFormData({ ...formData, toTime: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Reason for Leave</label>
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="Briefly explain why you need leave..."
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none"
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all"
                                    >
                                        Submit Application
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Leaves;
