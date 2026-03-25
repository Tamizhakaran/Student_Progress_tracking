import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiPlus, FiX, FiCheckCircle, FiClock, FiCalendar, FiFileText, FiAlertCircle } from 'react-icons/fi';
import api, { getFileUrl } from '../utils/api';
import { toast } from 'react-toastify';

const Achievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        eventName: '',
        certificationName: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        certificate: null
    });

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const { data } = await api.get('/achievements/my');
            setAchievements(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load achievements');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.eventName || !form.certificationName || !form.date || !form.notes || !form.certificate) {
            return toast.error('Please fill all details and upload a certificate');
        }

        try {
            const formData = new FormData();
            formData.append('eventName', form.eventName);
            formData.append('certificationName', form.certificationName);
            formData.append('date', form.date);
            formData.append('notes', form.notes);
            formData.append('certificate', form.certificate);

            await api.post('/achievements', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Achievement submitted for verification');
            setIsModalOpen(false);
            setForm({
                eventName: '',
                certificationName: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                certificate: null
            });
            fetchAchievements();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Verified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const handleViewCertificate = (e, url) => {
        if (url && url.startsWith('data:application/pdf')) {
            e.preventDefault();
            try {
                const arr = url.split(',');
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                
                // Optional cleanup
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            } catch (err) {
                console.error("Error opening PDF: ", err);
                window.open(url, '_blank'); 
            }
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                        Student <span className="text-indigo-600">Achievements</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg max-w-md italic">
                        Showcase your skills and certifications. Get them verified by the administration.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="relative z-10 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black shadow-xl flex items-center gap-3 transition-all"
                >
                    <FiPlus size={20} /> Submit New
                </motion.button>
            </div>

            {/* List section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    {loading ? (
                        <div className="text-center py-20 font-black text-slate-300 uppercase tracking-widest text-sm">Loading achievements...</div>
                    ) : achievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="premium-glass p-8 rounded-[2.5rem] border-white group hover:shadow-2xl transition-all duration-500"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border ${achievement.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            <FiAward />
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(achievement.status)}`}>
                                            {achievement.status}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{achievement.certificationName}</h4>
                                            <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-widest">{achievement.eventName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <FiCalendar /> {new Date(achievement.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                        {achievement.notes && (
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">
                                                {achievement.notes}
                                            </p>
                                        )}
                                        {achievement.certificate && (
                                            <a
                                                href={getFileUrl(achievement.certificate)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => handleViewCertificate(e, getFileUrl(achievement.certificate))}
                                                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                            >
                                                <FiFileText /> View Certificate
                                            </a>
                                        )}
                                        {achievement.adminRemark && (
                                            <div className={`mt-4 p-4 rounded-2xl border text-[10px] font-bold ${achievement.status === 'Verified' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-rose-50/50 border-rose-100 text-rose-700'}`}>
                                                <p className="uppercase tracking-[0.15em] mb-1 opacity-60">Admin Remark:</p>
                                                <p className="leading-relaxed">{achievement.adminRemark}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center glass-morphism rounded-[3rem] border-dashed border-2 border-slate-200">
                            <FiAward className="mx-auto text-4xl text-slate-300 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No achievements submitted yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
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
                            className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Submit Achievement</h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Upload details of your certification or event victory.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Event Name</label>
                                    <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200" placeholder="e.g. National Level Hackathon 2024" value={form.eventName} onChange={e => setForm({ ...form, eventName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Certification Name</label>
                                    <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200" placeholder="e.g. First Prize Winner" value={form.certificationName} onChange={e => setForm({ ...form, certificationName: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Date achieved</label>
                                        <input required type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Additional Notes</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200" placeholder="Describe your achievement..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Upload Certificate (Image or PDF)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={e => setForm({ ...form, certificate: e.target.files[0] })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-3">
                                    <FiCheckCircle size={20} /> Submit for Verification
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Achievements;
