import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiFilter, FiCheckCircle, FiXCircle,
    FiCalendar, FiClock, FiMessageSquare, FiUser, FiTrash2
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [remark, setRemark] = useState('');
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState('');

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves/admin/all');
            setLeaves(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch leave requests');
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await api.put(`/leaves/${selectedLeave}/status`, {
                status: verifyStatus,
                adminRemark: remark
            });
            toast.success(`Leave request ${verifyStatus === 'Approved' ? 'approved' : 'rejected'} successfully`);
            setRemark('');
            setIsVerifyModalOpen(false);
            fetchLeaves();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this leave request?')) return;
        try {
            await api.delete(`/leaves/${id}`);
            toast.success('Leave request deleted successfully');
            fetchLeaves();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const openVerifyModal = (id, status) => {
        setSelectedLeave(id);
        setVerifyStatus(status);
        setRemark('');
        setIsVerifyModalOpen(true);
    };

    const filteredLeaves = leaves.filter(l => {
        const matchesFilter = filter === 'All' || l.status === filter;
        const matchesSearch = l.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.student?.registerNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2 text-center md:text-left">Leave <span className="text-indigo-600">Management</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center md:text-left">Verification Vault</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="relative flex-1 group">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or register number..."
                        className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm outline-none focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-1 overflow-x-auto no-scrollbar">
                    {['Pending', 'Approved', 'Rejected', 'All'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-morphism rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-12">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLeaves.map((l, idx) => (
                                <motion.tr
                                    key={l._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 flex items-center justify-center text-slate-400 group-hover:from-indigo-50 group-hover:to-indigo-100 group-hover:text-indigo-600 transition-all duration-500">
                                                <FiUser size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 tracking-tight">{l.student?.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.student?.registerNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                                <FiCalendar className="text-indigo-500" />
                                                <span>{new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <FiClock className="text-slate-300" />
                                                <span>{l.fromTime} to {l.toTime}</span>
                                            </div>
                                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                                                {Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 max-w-xs">
                                        <p className="text-sm font-bold text-slate-600 line-clamp-2">{l.reason}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(l.status)}`}>
                                                {l.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-3 pr-4">
                                            {l.status === 'Pending' ? (
                                                <>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => openVerifyModal(l._id, 'Approved')}
                                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                        title="Approve"
                                                    >
                                                        <FiCheckCircle size={18} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => openVerifyModal(l._id, 'Rejected')}
                                                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                        title="Reject"
                                                    >
                                                        <FiXCircle size={18} />
                                                    </motion.button>
                                                </>
                                            ) : (
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic pr-4">
                                                    Processed
                                                </div>
                                            )}
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(l._id)}
                                                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredLeaves.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">
                                        No leave requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isVerifyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsVerifyModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10"
                        >
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
                                {verifyStatus === 'Approved' ? 'Approve Leave' : 'Reject Leave'}
                            </h2>
                            <p className="text-slate-400 font-bold text-sm mb-6">
                                Add a remark for the student regarding their leave application.
                            </p>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Admin Remark</label>
                                    <textarea
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none"
                                        placeholder="e.g. Permission granted. / Please provide more details."
                                        rows="4"
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateStatus}
                                    className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all ${verifyStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                                >
                                    Confirm {verifyStatus}
                                </button>
                                <button
                                    onClick={() => setIsVerifyModalOpen(false)}
                                    className="w-full py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeaveManagement;
