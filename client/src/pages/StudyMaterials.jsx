import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBookOpen, FiDownload, FiSearch, FiPlus, FiTrash2,
    FiFilter, FiFileText, FiX, FiCheckCircle, FiInbox
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const StudyMaterials = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '', description: '', subject: '', category: 'Notes',
        fileUrl: '', department: '', semester: ''
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get('/study-materials');
            setMaterials(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load study materials');
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await api.post('/study-materials', uploadForm);
            toast.success('Study material uploaded successfully');
            setIsUploadModalOpen(false);
            setUploadForm({
                title: '', description: '', subject: '', category: 'Notes',
                fileUrl: '', department: '', semester: ''
            });
            fetchMaterials();
        } catch (error) {
            toast.error('Upload failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            try {
                await api.delete(`/study-materials/${id}`);
                toast.success('Resource deleted');
                fetchMaterials();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Notes', 'Assignment', 'Question Paper', 'Reference'];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Resource Hub</h1>
                    <p className="text-slate-500 font-bold mt-2">Access premium study materials and academic resources.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                        >
                            <FiPlus className="text-lg" /> Upload Resource
                        </button>
                    )}
                    <div className="relative group w-full md:w-80">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search title or subject..."
                            className="w-full pl-14 pr-8 py-4 rounded-[2rem] bg-white border border-slate-200 outline-none focus:border-indigo-200 shadow-sm transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${filterCategory === cat
                                ? 'bg-slate-900 text-white border-slate-900 scale-105'
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence mode='popLayout'>
                    {filteredMaterials.map((material) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={material._id}
                            className="group glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl hover:shadow-indigo-100/50 transition-all flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-24 bg-indigo-500/5 rounded-bl-[5rem] group-hover:bg-indigo-500/10 transition-all"></div>

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className={`p-4 rounded-2xl bg-${material.category === 'Notes' ? 'indigo' : material.category === 'Assignment' ? 'emerald' : 'purple'}-50 text-${material.category === 'Notes' ? 'indigo' : material.category === 'Assignment' ? 'emerald' : 'purple'}-600`}>
                                    <FiFileText size={24} />
                                </div>
                                <span className="px-4 py-1.5 rounded-xl bg-slate-900/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {material.category}
                                </span>
                            </div>

                            <div className="flex-1 space-y-2 mb-8 relative">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                    {material.title}
                                </h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">{material.subject}</p>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2 mt-4">{material.description}</p>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100/50 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                        {material.uploadedBy?.name?.charAt(0)}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{material.uploadedBy?.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={material.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <FiDownload />
                                    </a>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(material._id)}
                                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {!loading && filteredMaterials.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="p-8 bg-slate-50 rounded-full mb-6">
                        <FiInbox size={48} className="text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No materials found</h3>
                    <p className="text-slate-400 font-bold max-w-sm mt-2">Try adjusting your filters or search terms.</p>
                </div>
            )}

            {/* Upload Modal (Admin Only) */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsUploadModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Upload Material</h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Add new academic resources to the hub.</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resource Title</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="e.g. Unit 1 Notes" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })} placeholder="e.g. Mathematics" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                                    <textarea required rows="3" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} placeholder="Provide a brief summary of the resource..." />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                                        <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">File URL</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.fileUrl} onChange={e => setUploadForm({ ...uploadForm, fileUrl: e.target.value })} placeholder="Paste file link here..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.department} onChange={e => setUploadForm({ ...uploadForm, department: e.target.value })} placeholder="e.g. CSE" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Semester</label>
                                        <input required type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.semester} onChange={e => setUploadForm({ ...uploadForm, semester: e.target.value })} placeholder="1-8" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:scale-[1.02] active:scale-98 transition-all mt-6 flex items-center justify-center gap-3">
                                    <FiCheckCircle size={20} /> Publish Material
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudyMaterials;
