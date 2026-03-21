import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiCheckCircle, FiXCircle, FiInfo, FiSearch, FiFilter, FiUser, FiCalendar, FiX, FiFileText } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AchievementManagement = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [remark, setRemark] = useState('');
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState('');

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const { data } = await api.get('/achievements/admin/all');
            setAchievements(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load achievements');
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        try {
            await api.put(`/achievements/${selectedAchievement}/verify`, {
                status: verifyStatus,
                remark: remark
            });
            toast.success(`Achievement ${verifyStatus === 'Verified' ? 'verified' : 'rejected'} successfully`);
            setRemark('');
            setIsVerifyModalOpen(false);
            fetchAchievements();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const openVerifyModal = (id, status) => {
        setSelectedAchievement(id);
        setVerifyStatus(status);
        setRemark('');
        setIsVerifyModalOpen(true);
    };

    const filteredAchievements = achievements.filter(a => {
        const matchesFilter = filter === 'All' || a.status === filter;
        const matchesSearch = a.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.certificationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.student?.registerNumber.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2 text-center md:text-left">
                    Achievement <span className="text-indigo-600">Vault</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center md:text-left italic">
                    Verify and authenticate student accomplishments
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="relative flex-1 group">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by student name, roll number, or certificate..."
                        className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm outline-none focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-1 overflow-x-auto no-scrollbar">
                    {['Pending', 'Verified', 'Rejected', 'All'].map(f => (
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Achievement Info</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-12">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center font-black text-slate-300 uppercase tracking-widest text-xs">Processing data...</td></tr>
                            ) : filteredAchievements.length > 0 ? (
                                filteredAchievements.map((a) => (
                                    <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm">
                                                    {a.student?.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight">{a.student?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.student?.registerNumber} • {a.student?.department}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 tracking-tight">{a.certificationName}</p>
                                            <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest mt-1 mb-2">{a.eventName}</p>
                                            {a.certificate && (
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL || ''}${a.certificate}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                                >
                                                    <FiFileText size={12} /> View Certificate
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <FiCalendar className="text-slate-400" />
                                                {new Date(a.date).toLocaleDateString('en-GB')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <div className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${a.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    a.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {a.status}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right pr-12">
                                            <div className="flex items-center justify-end gap-2">
                                                {a.status === 'Pending' && (
                                                    <>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => openVerifyModal(a._id, 'Verified')}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                            title="Verify"
                                                        >
                                                            <FiCheckCircle size={18} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => openVerifyModal(a._id, 'Rejected')}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                            title="Reject"
                                                        >
                                                            <FiXCircle size={18} />
                                                        </motion.button>
                                                    </>
                                                )}
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
                                                    title="View Notes"
                                                >
                                                    <FiInfo size={18} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <FiSearch className="mx-auto text-4xl text-slate-100 mb-4" />
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records matching your search</p>
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
                                {verifyStatus === 'Verified' ? 'Verify Achievement' : 'Reject Achievement'}
                            </h2>
                            <p className="text-slate-400 font-bold text-sm mb-6">
                                Add a remark for the student regarding their certificate.
                            </p>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Admin Remark</label>
                                    <textarea
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none"
                                        placeholder="e.g. Excellent work! / Document is blurry, please re-upload."
                                        rows="4"
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleVerify}
                                    className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all ${verifyStatus === 'Verified' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
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

export default AchievementManagement;
