import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit2, FiSave, FiX, FiCheckCircle, FiPlus, FiTrash2, FiActivity, FiAward, FiClock, FiEye, FiUpload } from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { DEPARTMENTS } from '../utils/constants';
import { getMediaURL } from '../utils/mediaUtils';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', registerNumber: '', department: '', semester: '', cgpa: '', password: ''
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditingGrades, setIsEditingGrades] = useState(false);
    const [tempGrades, setTempGrades] = useState(new Array(8).fill(0));
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const { data } = await api.get('/students');
            setStudents(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load students');
            setLoading(false);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student._id);
        setEditForm(student);
    };

    const handleUpdate = async () => {
        try {
            const updatePayload = {
                name: editForm.name,
                email: editForm.email,
                registerNumber: editForm.registerNumber,
                department: editForm.department,
                semester: editForm.semester ? editForm.semester.toString() : '1',
                cgpa: editForm.cgpa ? parseFloat(editForm.cgpa) : 0
            };

            if (editForm.password) {
                updatePayload.password = editForm.password;
            }

            await api.put(`/students/${editingStudent}`, updatePayload);
            toast.success('Student details updated successfully');
            setEditingStudent(null);
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student record?')) {
            try {
                await api.delete(`/students/${id}`);
                toast.success('Student record deleted');
                fetchStudents();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/students', createForm);
            toast.success('Student record created');
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', email: '', registerNumber: '', department: '', semester: '', cgpa: '', password: '' });
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Creation failed');
        }
    };

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setTempGrades(student.semesterGrades || new Array(8).fill(0));
        setIsDetailsModalOpen(true);
        setIsEditingGrades(false);
    };

    const handleUpdateGrades = async () => {
        try {
            await api.put(`/students/${selectedStudent._id}`, {
                semesterGrades: tempGrades
            });
            toast.success('Semester grades updated');
            setIsEditingGrades(false);
            fetchStudents();
            // Update the local selected student state as well
            setSelectedStudent({ ...selectedStudent, semesterGrades: tempGrades });
        } catch (error) {
            toast.error('Failed to update grades');
        }
    };

    const toggleBulkEdit = () => {
        if (!isBulkEditing) {
            const initialData = {};
            filteredStudents.forEach(s => {
                initialData[s._id] = { ...s };
            });
            setBulkEditData(initialData);
        }
        setIsBulkEditing(!isBulkEditing);
        setEditingStudent(null);
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
            const studentsToUpdate = Object.keys(bulkEditData).map(id => {
                const s = bulkEditData[id];
                return {
                    id,
                    name: s.name,
                    email: s.email,
                    registerNumber: s.registerNumber,
                    department: s.department,
                    semester: s.semester ? s.semester.toString() : '1',
                    cgpa: s.cgpa ? parseFloat(s.cgpa) : 0
                };
            });

            await api.put('/students/bulk', { students: studentsToUpdate });
            toast.success('Batch records updated successfully');
            setIsBulkEditing(false);
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk update failed');
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            const headers = rows[0].split(',').map(h => h.trim());

            const studentsArray = rows.slice(1)
                .filter(row => row.trim() !== '')
                .map(row => {
                    const values = row.split(',').map(v => v.trim());
                    const student = {};
                    headers.forEach((header, index) => {
                        // Map fullName to name for backend
                        const key = header === 'fullName' ? 'name' : header;
                        student[key] = values[index];
                    });
                    return student;
                });

            if (studentsArray.length === 0) {
                toast.error('No valid data found in CSV');
                return;
            }

            try {
                setLoading(true);
                const { data } = await api.post('/students/bulk-upload', { students: studentsArray });
                const { summary } = data;
                toast.success(`Success: ${summary.success}, Duplicates: ${summary.duplicates}, Errors: ${summary.errors}`);
                fetchStudents();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Bulk upload failed');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.registerNumber && s.registerNumber.includes(searchTerm))
    );

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Student <span className="text-indigo-600">Records</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Manage student details and academic records with ease.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isBulkEditing ? handleBulkSave : toggleBulkEdit}
                        className={`px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${isBulkEditing ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-500/20'} text-white`}
                    >
                        {isBulkEditing ? <><FiSave className="text-lg" /> Save Changes</> : <><FiEdit2 className="text-lg" /> Edit Records</>}
                    </motion.button>
                    {isBulkEditing && (
                        <motion.button
                            whileHover={{ scale: 1.05, translateY: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsBulkEditing(false)}
                            className="px-8 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 transition-all flex items-center gap-3"
                        >
                            <FiX className="text-lg" /> Cancel
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => document.getElementById('bulk-csv-upload').click()}
                        className="px-8 py-5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3"
                    >
                        <FiUpload className="text-lg" /> Bulk Upload
                    </motion.button>
                    <input
                        type="file"
                        id="bulk-csv-upload"
                        accept=".csv"
                        className="hidden"
                        onChange={handleBulkUpload}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3"
                    >
                        <FiPlus className="text-lg" /> Onboard Student
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ManagementStatCard
                    icon={<LuGraduationCap />}
                    label="Total Enrollment"
                    value={students.length}
                    sub="Active Scholars"
                    color="indigo"
                />
                <ManagementStatCard
                    icon={<FiAward />}
                    label="Cohort Average"
                    value={(students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / (students.length || 1)).toFixed(2)}
                    sub="CGPA Performance"
                    color="purple"
                />
                <ManagementStatCard
                    icon={<FiActivity />}
                    label="Avg Participation"
                    value={`${(students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / (students.length || 1)).toFixed(1)}%`}
                    sub="Attendance Metric"
                    color="emerald"
                />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative group flex-1 w-full">
                    <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-500" />
                    <input
                        type="text"
                        placeholder="Find students by name or register number..."
                        className="w-full pl-18 pr-8 py-6 rounded-[2.5rem] premium-glass outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-2xl shadow-indigo-100/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-morphism rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/5 text-slate-500">
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Full Identity</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Enrollment ID</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Branch / Dept</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-center">Semester</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">Attendance</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em]">CGPA</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student._id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner border border-indigo-100/50 overflow-hidden">
                                                {student.profileImage && student.profileImage !== 'no-photo.jpg' && getMediaURL(student.profileImage) ? (
                                                    <img
                                                        src={getMediaURL(student.profileImage)}
                                                        alt={student.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentElement.innerHTML = student.name.charAt(0);
                                                        }}
                                                    />
                                                ) : (
                                                    student.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                {editingStudent === student._id ? (
                                                    <>
                                                        <input
                                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-indigo-400 transition-all mb-2"
                                                            placeholder="Full Name"
                                                            value={editForm.name || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        />
                                                        <input
                                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-[11px] font-black outline-none focus:border-indigo-400 transition-all mb-2"
                                                            placeholder="Email Address"
                                                            value={editForm.email || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                        />
                                                        <input
                                                            type="password"
                                                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:border-indigo-400 transition-all"
                                                            placeholder="New Password (leave blank to keep)"
                                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-black text-slate-900 leading-none mb-2 uppercase tracking-tight text-base">{student.name}</p>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{student.email}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingStudent === student._id || isBulkEditing) ? (
                                            <input
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-indigo-400 transition-all w-full"
                                                value={(isBulkEditing ? bulkEditData[student._id]?.registerNumber : editForm.registerNumber) || ''}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(student._id, 'registerNumber', e.target.value)
                                                    : setEditForm({ ...editForm, registerNumber: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-black text-slate-900 tracking-widest text-xs py-2 px-4 bg-slate-100 rounded-xl">{student.registerNumber || 'N/A'}</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingStudent === student._id || isBulkEditing) ? (
                                            <select
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-indigo-400 transition-all w-full cursor-pointer appearance-none"
                                                value={(isBulkEditing ? bulkEditData[student._id]?.department : editForm.department) || ''}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(student._id, 'department', e.target.value)
                                                    : setEditForm({ ...editForm, department: e.target.value })}
                                            >
                                                <option value="">Select Dept</option>
                                                {DEPARTMENTS.map((dept) => (
                                                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                <span className="font-black text-slate-600 text-[11px] uppercase tracking-widest">{student.department || 'N/A'}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        {(editingStudent === student._id || isBulkEditing) ? (
                                            <select
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black w-24 outline-none focus:border-indigo-400 transition-all text-center cursor-pointer appearance-none"
                                                value={(isBulkEditing ? bulkEditData[student._id]?.semester : editForm.semester) || ''}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(student._id, 'semester', e.target.value)
                                                    : setEditForm({ ...editForm, semester: e.target.value })}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-4 py-2 rounded-xl bg-indigo-50/50 text-[11px] font-black text-indigo-600 border border-indigo-100/50">SEM {student.semester || '0'}</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                <span>{student.attendancePercentage || 0}%</span>
                                                <span className={student.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}>
                                                    {student.attendancePercentage >= 75 ? 'OPTIMAL' : 'CRITICAL'}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${student.attendancePercentage || 0}%` }}
                                                    className={`h-full transition-all duration-1000 ${student.attendancePercentage >= 75 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        {(editingStudent === student._id || isBulkEditing) ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black w-24 outline-none focus:border-indigo-400 transition-all text-center"
                                                value={(isBulkEditing ? bulkEditData[student._id]?.cgpa : editForm.cgpa) ?? ''}
                                                onChange={(e) => isBulkEditing
                                                    ? handleBulkChange(student._id, 'cgpa', e.target.value)
                                                    : setEditForm({ ...editForm, cgpa: e.target.value })}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100/50">
                                                    <FiAward size={18} />
                                                </div>
                                                <span className="font-black text-slate-900 text-lg tracking-tighter">{student.cgpa ? student.cgpa.toFixed(2) : '0.00'}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {!isBulkEditing && (
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                {editingStudent === student._id ? (
                                                    <>
                                                        <button onClick={handleUpdate} className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-emerald-200">
                                                            <FiCheckCircle />
                                                        </button>
                                                        <button onClick={() => setEditingStudent(null)} className="p-3 bg-rose-500 text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-rose-200">
                                                            <FiX />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleViewDetails(student)} className="p-3 bg-white text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                            <FiEye />
                                                        </button>
                                                        <button onClick={() => handleEdit(student)} className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                            <FiEdit2 />
                                                        </button>
                                                        <button onClick={() => handleDelete(student._id)} className="p-3 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                            <FiTrash2 />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && !loading && (
                        <div className="p-20 text-center">
                            <LuGraduationCap className="mx-auto text-4xl text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found matching your search</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Student Modal */}
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
                        className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] custom-scrollbar"
                    >
                        <div className="absolute top-0 right-0 p-6">
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                                <FiX className="text-2xl" />
                            </button>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">New Student</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">Enter student details to register them in the system.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        placeholder="Enter name"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Register Number</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        placeholder="e.g. 7376211CS101"
                                        value={createForm.registerNumber}
                                        onChange={(e) => setCreateForm({ ...createForm, registerNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                    placeholder="student@bitsathy.ac.in"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all font-black"
                                    placeholder="Set student password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                />
                            </div>



                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all cursor-pointer"
                                        value={createForm.department}
                                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map((dept) => (
                                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Semester</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all appearance-none cursor-pointer"
                                        value={createForm.semester}
                                        onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                                    >
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num.toString()}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CGPA</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all font-black"
                                    placeholder="e.g. 8.50"
                                    value={createForm.cgpa}
                                    onChange={(e) => setCreateForm({ ...createForm, cgpa: e.target.value })}
                                />
                            </div>


                            <button
                                type="submit"
                                className="w-full py-4 mt-6 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Register Student
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
            {/* Student Details Modal */}
            {isDetailsModalOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setIsDetailsModalOpen(false)}
                    />
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                    >
                        <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all z-20">
                                <FiX className="text-xl" />
                            </button>
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 p-2 bg-white rounded-[2.5rem] z-10 transition-transform hover:scale-105">
                                <div className="w-32 h-32 rounded-[2rem] bg-slate-900 overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center text-4xl text-white font-black relative">
                                    {selectedStudent.profileImage && selectedStudent.profileImage !== 'no-photo.jpg' && getMediaURL(selectedStudent.profileImage) ? (
                                        <img
                                            src={getMediaURL(selectedStudent.profileImage)}
                                            alt={selectedStudent.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.parentElement.innerHTML = selectedStudent.name.charAt(0);
                                            }}
                                        />
                                    ) : (
                                        selectedStudent.name.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-24 pb-12 px-12 text-center">
                            <div className="flex flex-col items-center mb-10">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedStudent.name}</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">{selectedStudent.email}</p>
                                
                                <div className="mt-6 flex flex-wrap justify-center gap-3">
                                    <div className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                                        ID: {selectedStudent.registerNumber}
                                    </div>
                                    <div className="px-5 py-2 rounded-2xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">
                                        {selectedStudent.department}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="profile-image-upload"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                try {
                                                    setLoading(true);
                                                    const uploadFormData = new FormData();
                                                    uploadFormData.append('uploadType', 'profiles');
                                                    uploadFormData.append('image', file);

                                                    const { data: uploadData } = await api.post('/upload', uploadFormData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });

                                                    const photoUrl = uploadData.data;
                                                    await api.put(`/students/${selectedStudent._id}`, { profileImage: photoUrl });

                                                    toast.success('Profile image updated');
                                                    fetchStudents();
                                                    setSelectedStudent({ ...selectedStudent, profileImage: photoUrl });
                                                } catch (error) {
                                                    toast.error('Failed to update image');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="profile-image-upload"
                                        className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 transition-all inline-flex items-center gap-2 shadow-md"
                                    >
                                        <FiPlus /> Change Photo
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-10">
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                                    <FiAward className="text-indigo-600 mb-3" size={24} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CGPA</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedStudent.cgpa?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                                    <FiActivity className="text-emerald-600 mb-3" size={24} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedStudent.attendancePercentage || 0}%</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                                    <FiClock className="text-rose-600 mb-3" size={24} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classes</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedStudent.totalClasses || 0}</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-black text-slate-900 tracking-tight">Semester GPA Tracks</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic Performance History</p>
                                    </div>
                                    <button
                                        onClick={() => isEditingGrades ? handleUpdateGrades() : setIsEditingGrades(true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditingGrades ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-slate-900 hover:text-white'}`}
                                    >
                                        {isEditingGrades ? <><FiSave /> Save Records</> : <><FiEdit2 /> Update Grades</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {tempGrades.map((grade, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">Sem {idx + 1}</p>
                                            {isEditingGrades ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="10"
                                                    placeholder="0.0"
                                                    className="w-full bg-white border border-indigo-100 rounded-xl px-2 py-3 text-center font-black text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                    value={grade === 0 ? '' : grade}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const newGrades = [...tempGrades];
                                                        newGrades[idx] = val === '' ? 0 : parseFloat(val);
                                                        setTempGrades(newGrades);
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full bg-white/50 border border-slate-100 rounded-xl py-3 text-center font-black text-slate-900 text-xs">
                                                    {grade || '0.0'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-slate-900">Current Activity</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active Now</span>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm font-bold text-slate-600">
                                    <p className="flex justify-between">
                                        <span>Last System Login:</span>
                                        <span className="text-slate-900">{new Date(selectedStudent.lastActivity || selectedStudent.updatedAt).toLocaleString()}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Current Status:</span>
                                        <span className="text-emerald-600">Online & Synchronized</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const ManagementStatCard = ({ icon, label, value, sub, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
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
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-2">{sub}</p>
            </div>
        </motion.div>
    );
};

export default StudentManagement;
