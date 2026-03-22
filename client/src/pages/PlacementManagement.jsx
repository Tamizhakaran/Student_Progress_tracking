import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiCheckCircle, FiX, FiBriefcase, FiCalendar, FiUsers, FiDollarSign } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { DEPARTMENTS } from '../utils/constants';
import { getMediaURL } from '../utils/mediaUtils';

const PlacementManagement = () => {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'Offer',
        companyName: '',
        companyUrl: '',
        role: '',
        department: '',
        date: '',
        eligibility: '',
        studentName: '',
        salaryPackage: '',
        studentPhoto: 'no-photo.jpg'
    });

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchPlacements();
    }, []);

    const fetchPlacements = async () => {
        try {
            const { data } = await api.get('/placements');
            setPlacements(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load placements');
            setLoading(false);
        }
    };

    const handleOpenModal = (placement = null) => {
        if (placement) {
            setEditingId(placement._id);
            setFormData({
                type: placement.type,
                companyName: placement.companyName,
                companyUrl: placement.companyUrl || '',
                role: placement.role,
                department: placement.department || '',
                date: placement.date ? new Date(placement.date).toISOString().split('T')[0] : '',
                eligibility: placement.eligibility || '',
                studentName: placement.studentName || '',
                salaryPackage: placement.salaryPackage || '',
                studentPhoto: placement.studentPhoto || 'no-photo.jpg'
            });
        } else {
            setEditingId(null);
            setFormData({
                type: 'Offer',
                companyName: '',
                companyUrl: '',
                role: '',
                department: '',
                date: '',
                eligibility: '',
                studentName: '',
                salaryPackage: '',
                studentPhoto: 'no-photo.jpg'
            });
        }
        setIsModalOpen(true);
        setSelectedFile(null);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let photoUrl = formData.studentPhoto;

            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', selectedFile);
                uploadFormData.append('uploadType', 'students');

                const { data: uploadData } = await api.post('/upload', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoUrl = uploadData.data;
            }

            const finalData = { ...formData, studentPhoto: photoUrl };

            if (editingId) {
                await api.put(`/placements/${editingId}`, finalData);
                toast.success('Placement updated successfully');
            } else {
                await api.post('/placements', finalData);
                toast.success('Placement created successfully');
            }
            setIsModalOpen(false);
            fetchPlacements();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await api.delete(`/placements/${id}`);
                toast.success('Record deleted');
                fetchPlacements();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">
                        Placement <span className="text-indigo-600">Hub</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">
                        Manage placement offers and upcoming campus drives
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all"
                >
                    <FiPlus size={18} /> Add New Entry
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Placement Offers Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <FiUsers size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Placement Offers</h2>
                    </div>
                    <div className="space-y-4">
                        {placements.filter(p => p.type === 'Offer').length > 0 ? (
                            placements.filter(p => p.type === 'Offer').map(p => (
                                <PlacementCard key={p._id} placement={p} onEdit={handleOpenModal} onDelete={handleDelete} />
                            ))
                        ) : (
                            <EmptyState label="No placement offers recorded" />
                        )}
                    </div>
                </div>

                {/* Upcoming Companies Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <FiBriefcase size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upcoming Companies</h2>
                    </div>
                    <div className="space-y-4">
                        {placements.filter(p => p.type === 'Upcoming').length > 0 ? (
                            placements.filter(p => p.type === 'Upcoming').map(p => (
                                <PlacementCard key={p._id} placement={p} onEdit={handleOpenModal} onDelete={handleDelete} />
                            ))
                        ) : (
                            <EmptyState label="No upcoming companies listed" />
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
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
                            className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {editingId ? 'Edit Entry' : 'Add New Entry'}
                                    </h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Configure placement details below.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type</label>
                                    <div className="flex gap-4">
                                        {['Offer', 'Upcoming'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: t })}
                                                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${formData.type === t ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white'}`}
                                            >
                                                {t === 'Offer' ? 'Placement Offer' : 'Upcoming Company'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Company Name</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="e.g. Google" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Role / Designation</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Software Engineer" />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Company Website URL</label>
                                        <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.companyUrl} onChange={e => setFormData({ ...formData, companyUrl: e.target.value })} placeholder="e.g. https://google.com" />
                                    </div>
                                </div>

                                {formData.type === 'Offer' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Student Name</label>
                                            <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} placeholder="e.g. John Doe" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Package (LPA)</label>
                                            <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.salaryPackage} onChange={e => setFormData({ ...formData, salaryPackage: e.target.value })} placeholder="e.g. 12 LPA" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Student Department</label>
                                            <select required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                                <option value="">Select Dept</option>
                                                {DEPARTMENTS.map(dept => <option key={dept.value} value={dept.value}>{dept.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Student Photo</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    id="student-photo-upload"
                                                />
                                                <label
                                                    htmlFor="student-photo-upload"
                                                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm cursor-pointer hover:bg-slate-100 transition-all flex items-center justify-between"
                                                >
                                                    <span className="truncate">{selectedFile ? selectedFile.name : 'Choose Photo'}</span>
                                                    <FiPlus className="text-slate-400" />
                                                </label>
                                                {formData.studentPhoto && formData.studentPhoto !== 'no-photo.jpg' && getMediaURL(formData.studentPhoto) && (
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100">
                                                        <img 
                                                            src={getMediaURL(formData.studentPhoto)} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Visit Date</label>
                                            <input required type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Eligibility</label>
                                            <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={formData.eligibility} onChange={e => setFormData({ ...formData, eligibility: e.target.value })} placeholder="e.g. CGPA > 7.5, All Depts" />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-98 transition-all mt-6 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                                    <FiCheckCircle size={20} /> {editingId ? 'Update Record' : 'Publish Entry'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PlacementCard = ({ placement, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {placement.type === 'Offer' ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                            {placement.studentPhoto && placement.studentPhoto !== 'no-photo.jpg' && getMediaURL(placement.studentPhoto) ? (
                                <img 
                                    src={getMediaURL(placement.studentPhoto)} 
                                    alt={placement.studentName} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl uppercase">${placement.studentName?.charAt(0)}</div>`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl uppercase">
                                    {placement.studentName?.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                            <FiBriefcase />
                        </div>
                    )}
                    <div>
                        <h3 className="font-black text-slate-900 tracking-tight leading-tight">{placement.companyName}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{placement.role}</p>
                            {placement.department && (
                                <>
                                    <span className="text-slate-200 text-[10px]">•</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{placement.department}</span>
                                </>
                            )}
                            {placement.companyUrl && (
                                <>
                                    <span className="text-slate-200 text-[10px]">•</span>
                                    <a href={placement.companyUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest shrink-0">Visit Site</a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(placement)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(placement._id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                {placement.type === 'Offer' ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Placed:</span>
                            <span className="text-xs font-black text-slate-700">{placement.studentName}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                            <span className="text-xs font-black text-indigo-600">₹</span>
                            <span className="text-xs font-black text-indigo-600">{placement.salaryPackage}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-emerald-600" size={12} />
                            <span className="text-xs font-black text-slate-700">
                                {new Date(placement.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {placement.eligibility}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ label }) => (
    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">{label}</p>
    </div>
);

export default PlacementManagement;
