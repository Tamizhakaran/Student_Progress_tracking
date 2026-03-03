import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit2, FiSave, FiX, FiCheckCircle, FiPlus, FiTrash2, FiCreditCard, FiActivity, FiFilter, FiClock, FiCalendar } from 'react-icons/fi';
import { LuAlertTriangle } from 'react-icons/lu';
import { MdCurrencyRupee } from 'react-icons/md';
import api from '../utils/api';
import { toast } from 'react-toastify';

const FeeManagement = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFee, setEditingFee] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        studentEmail: '', totalAmount: '', dueDate: '', category: 'Tuition', academicYear: '2025-2026', notes: ''
    });
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({});

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const { data } = await api.get('/fees');
            setFees(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load fee records');
            setLoading(false);
        }
    };

    const handleEdit = (fee) => {
        setEditingFee(fee._id);
        setEditForm(fee);
    };

    const handleUpdate = async () => {
        try {
            if (editForm.isPlaceholder) {
                const { _id, isPlaceholder, ...payload } = editForm;
                payload.studentEmail = payload.student.email;
                await api.post('/fees', payload);
                toast.success('Fee record created');
            } else {
                await api.put(`/fees/${editingFee}`, editForm);
                toast.success('Fee record updated');
            }
            setEditingFee(null);
            fetchFees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this fee record?')) {
            try {
                await api.delete(`/fees/${id}`);
                toast.success('Fee record deleted');
                fetchFees();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fees', createForm);
            toast.success('Fee record created');
            setIsCreateModalOpen(false);
            setCreateForm({
                studentEmail: '', totalAmount: '', dueDate: '', category: 'Tuition', academicYear: '2025-2026', notes: ''
            });
            fetchFees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Creation failed');
        }
    };

    const toggleBulkEdit = () => {
        if (!isBulkEditing) {
            const initialData = {};
            fees.forEach(f => {
                initialData[f._id] = { ...f };
            });
            setBulkEditData(initialData);
        }
        setIsBulkEditing(!isBulkEditing);
        setEditingFee(null);
    };

    const handleBulkChange = (id, field, value) => {
        setBulkEditData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleBulkSave = async () => {
        try {
            const feesToUpdate = Object.values(bulkEditData).map(f => ({
                ...f,
                totalAmount: Number(f.totalAmount),
                paidAmount: Number(f.paidAmount)
            }));
            await api.put('/fees/bulk', { fees: feesToUpdate });
            toast.success('Batch records updated successfully');
            setIsBulkEditing(false);
            fetchFees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk update failed');
        }
    };

    const applyToAll = (field, value) => {
        const newData = { ...bulkEditData };
        Object.keys(newData).forEach(id => {
            newData[id] = { ...newData[id], [field]: value };
        });
        setBulkEditData(newData);
        toast.info(`Applied ${field} to all students`);
    };

    const calculateStatus = (total, paid, due) => {
        const totalNum = Number(total) || 0;
        const paidNum = Number(paid) || 0;
        if (totalNum > 0 && paidNum >= totalNum) return 'Paid';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(due);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) return 'Overdue';
        return 'Pending';
    };

    const filteredFees = fees.filter(f =>
        f.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.student?.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const studentFeeGroups = fees.reduce((acc, f) => {
        const studentId = f.student?._id || f.student;
        if (!studentId) return acc;
        if (!acc[studentId]) {
            acc[studentId] = { total: 0, paid: 0 };
        }
        acc[studentId].total += f.totalAmount || 0;
        acc[studentId].paid += f.paidAmount || 0;
        return acc;
    }, {});

    const studentFeesArray = Object.values(studentFeeGroups);

    const stats = {
        total: fees.reduce((acc, f) => acc + f.totalAmount, 0),
        collected: fees.reduce((acc, f) => acc + f.paidAmount, 0),
        fullPaid: studentFeesArray.filter(s => s.paid >= s.total && s.total > 0).length,
        halfPaid: studentFeesArray.filter(s => s.paid >= s.total / 2 && s.paid < s.total && s.total > 0).length,
        pending: fees.filter(f => f.status === 'Pending').length,
        overdue: fees.filter(f => f.status === 'Overdue').length
    };

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Fee <span className="text-indigo-600">Management</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Track and manage student financial obligations and payment history.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isBulkEditing ? handleBulkSave : toggleBulkEdit}
                        className={`px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${isBulkEditing ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-500/20'} text-white`}
                    >
                        {isBulkEditing ? <><FiSave className="text-lg" /> Save All</> : <><FiEdit2 className="text-lg" /> Edit All</>}
                    </motion.button>
                    {isBulkEditing && (
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsBulkEditing(false)}
                                className="px-6 py-5 bg-slate-200 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3"
                            >
                                <FiX className="text-lg" /> Cancel
                            </motion.button>
                        </div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3"
                    >
                        <FiPlus className="text-lg" /> Create Fee Record
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FeeStatCard
                    icon={<FiCheckCircle />}
                    label="Full Fees Paid"
                    value={stats.fullPaid}
                    sub="Total Students"
                    color="indigo"
                />
                <FeeStatCard
                    icon={<FiActivity />}
                    label="Half Fees Paid"
                    value={stats.halfPaid}
                    sub="Partial Payments"
                    color="emerald"
                />
                <FeeStatCard
                    icon={<FiClock />}
                    label="Pending Records"
                    value={stats.pending}
                    sub="Waiting for Payment"
                    color="amber"
                />
                <FeeStatCard
                    icon={<LuAlertTriangle />}
                    label="Overdue Alerts"
                    value={stats.overdue}
                    sub="Action Required"
                    color="rose"
                />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative group flex-1 w-full">
                    <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-500" />
                    <input
                        type="text"
                        placeholder="Search by student name, roll number, or category..."
                        className="w-full pl-18 pr-8 py-6 rounded-[2.5rem] premium-glass outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-2xl shadow-indigo-100/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isBulkEditing && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl flex flex-wrap items-center gap-10 border border-slate-800"
                >
                    <div className="flex-1 min-w-[200px]">
                        <h3 className="font-black text-xl tracking-tight mb-1">Bulk Actions</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Apply a value to every student in this session</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-3 border border-slate-700 transition-all group/item hover:border-indigo-500/50">
                            <FiCreditCard className="text-slate-500 ml-3 group-hover/item:text-indigo-400 transition-colors" />
                            <input
                                type="number"
                                placeholder="Total Amount"
                                className="bg-transparent w-32 outline-none font-black text-sm px-2 placeholder:text-slate-500 text-white"
                                id="bulk-total"
                            />
                            <button
                                onClick={() => applyToAll('totalAmount', document.getElementById('bulk-total').value)}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
                            >
                                Set All
                            </button>
                        </div>

                        <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-3 border border-slate-700 transition-all group/item hover:border-indigo-500/50">
                            <FiCalendar className="text-slate-500 ml-3 group-hover/item:text-indigo-400 transition-colors" />
                            <input
                                type="date"
                                className="bg-transparent outline-none font-black text-sm px-2 text-white uppercase text-[10px] cursor-pointer min-w-[150px]"
                                id="bulk-date"
                                onClick={(e) => e.target.showPicker?.()}
                            />
                            <button
                                onClick={() => applyToAll('dueDate', document.getElementById('bulk-date').value)}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
                            >
                                Set All
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="glass-morphism rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/5 text-slate-500">
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Student Information</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Category / Session</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Due Date</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Total Amount</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Paid Amount</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredFees.map((fee) => (
                                <tr key={fee._id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner border border-indigo-100/50">
                                                {fee.student?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none mb-2 uppercase tracking-tight text-base">{fee.student?.name || 'Unknown Student'}</p>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Register: {fee.student?.registerNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingFee === fee._id || isBulkEditing) ? (
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-indigo-400 transition-all cursor-pointer"
                                                    value={isBulkEditing ? bulkEditData[fee._id]?.category : editForm.category}
                                                    onChange={(e) => isBulkEditing
                                                        ? handleBulkChange(fee._id, 'category', e.target.value)
                                                        : setEditForm({ ...editForm, category: e.target.value })}
                                                >
                                                    <option value="Tuition">Tuition</option>
                                                    <option value="Hostel">Hostel</option>
                                                    <option value="Exam">Exam</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none ml-1">{fee.academicYear}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-sm">{fee.category}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{fee.academicYear}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingFee === fee._id || isBulkEditing) ? (
                                            <input
                                                type="date"
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-indigo-400 transition-all"
                                                value={(() => {
                                                    const dateVal = isBulkEditing ? bulkEditData[fee._id]?.dueDate : editForm.dueDate;
                                                    if (!dateVal) return '';
                                                    try {
                                                        return new Date(dateVal).toISOString().split('T')[0];
                                                    } catch (e) {
                                                        return '';
                                                    }
                                                })()}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(fee._id, 'dueDate', e.target.value)
                                                    : setEditForm({ ...editForm, dueDate: e.target.value })}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-slate-300" />
                                                <span className="font-black text-slate-600 text-sm tracking-tight">{new Date(fee.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingFee === fee._id || isBulkEditing) ? (
                                            <input
                                                type="number"
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black w-32 outline-none focus:border-indigo-400 transition-all"
                                                value={isBulkEditing ? bulkEditData[fee._id]?.totalAmount : editForm.totalAmount}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(fee._id, 'totalAmount', e.target.value)
                                                    : setEditForm({ ...editForm, totalAmount: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-black text-slate-900 text-base tracking-tight">₹{fee.totalAmount.toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingFee === fee._id || isBulkEditing) ? (
                                            <input
                                                type="number"
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black w-32 outline-none focus:border-indigo-400 transition-all"
                                                value={isBulkEditing ? bulkEditData[fee._id]?.paidAmount : editForm.paidAmount}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(fee._id, 'paidAmount', e.target.value)
                                                    : setEditForm({ ...editForm, paidAmount: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-black text-emerald-600 text-base tracking-tight">₹{fee.paidAmount.toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {isBulkEditing ? (
                                            <StatusBadge status={calculateStatus(
                                                bulkEditData[fee._id]?.totalAmount,
                                                bulkEditData[fee._id]?.paidAmount,
                                                bulkEditData[fee._id]?.dueDate
                                            )} />
                                        ) : (
                                            <StatusBadge status={fee.status} />
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {!isBulkEditing && (
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                {editingFee === fee._id ? (
                                                    <>
                                                        <button onClick={handleUpdate} className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-emerald-200">
                                                            <FiCheckCircle />
                                                        </button>
                                                        <button onClick={() => setEditingFee(null)} className="p-3 bg-rose-500 text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-rose-200">
                                                            <FiX />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEdit(fee)} className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                            <FiEdit2 />
                                                        </button>
                                                        {!fee.isPlaceholder && (
                                                            <button onClick={() => handleDelete(fee._id)} className="p-3 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                                <FiTrash2 />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredFees.length === 0 && !loading && (
                        <div className="p-20 text-center">
                            <MdCurrencyRupee className="mx-auto text-4xl text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No fee records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Fee Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6">
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                                <FiX className="text-2xl" />
                            </button>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Fee Record</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">Set up a new payment obligation for a student.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Student Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                    placeholder="student@bitsathy.ac.in"
                                    value={createForm.studentEmail}
                                    onChange={(e) => setCreateForm({ ...createForm, studentEmail: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Total Amount (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        placeholder="0"
                                        value={createForm.totalAmount}
                                        onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Due Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        value={createForm.dueDate}
                                        onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                                    <select
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all cursor-pointer"
                                        value={createForm.category}
                                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                                    >
                                        <option value="Tuition">Tuition Fee</option>
                                        <option value="Hostel">Hostel Fee</option>
                                        <option value="Exam">Exam Fee</option>
                                        <option value="Other">Other Fees</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Academic Year</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        placeholder="2025-2026"
                                        value={createForm.academicYear}
                                        onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Additional Notes</label>
                                <textarea
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none"
                                    rows="3"
                                    placeholder="Optional notes..."
                                    value={createForm.notes}
                                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 mt-6 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Register Fee Record
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const FeeStatCard = ({ icon, label, value, sub, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
    };
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="premium-glass p-8 rounded-[2.5rem] shadow-xl relative group overflow-hidden"
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${colors[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-2">{sub}</p>
            </div>
        </motion.div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        Pending: 'bg-amber-50 text-amber-600 border-amber-100',
        Overdue: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
            {status}
        </span>
    );
};

export default FeeManagement;
