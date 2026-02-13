import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit2, FiSave, FiX, FiCheckCircle, FiPlus, FiTrash2, FiActivity, FiAward, FiClock, FiEye } from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { DEPARTMENTS } from '../utils/constants';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', registerNumber: '', department: '', semester: ''
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
            await api.put(`/students/${editingStudent}`, editForm);
            toast.success('Student details updated');
            setEditingStudent(null);
            fetchStudents();
        } catch (error) {
            toast.error('Update failed');
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
            setCreateForm({ name: '', email: '', registerNumber: '', department: '', semester: '' });
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Creation failed');
        }
    };

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setIsDetailsModalOpen(true);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.registerNumber && s.registerNumber.includes(searchTerm))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Management</h1>
                    <p className="text-slate-500 font-bold mt-1">Add, view, and update student records.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FiPlus /> New Student
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-morphism p-8 rounded-3xl border-white shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Students</p>
                        <h3 className="text-3xl font-black text-slate-900">{students.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <LuGraduationCap />
                    </div>
                </div>
                <div className="glass-morphism p-8 rounded-3xl border-white shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg CGPA</p>
                        <h3 className="text-3xl font-black text-indigo-600">
                            {(students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / (students.length || 1)).toFixed(2)}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <FiAward />
                    </div>
                </div>
                <div className="glass-morphism p-8 rounded-3xl border-white shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Attendance</p>
                        <h3 className="text-3xl font-black text-emerald-600">
                            {(students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / (students.length || 1)).toFixed(1)}%
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <FiActivity />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative group w-full">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search name, email, register number or department..."
                        className="w-full pl-14 pr-8 py-5 rounded-[2rem] bg-white border border-slate-100 outline-none focus:border-indigo-200 shadow-xl shadow-slate-200/20 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-morphism rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Register Number</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Semester</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">CGPA</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student._id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none mb-1">{student.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {editingStudent === student._id ? (
                                            <input
                                                className="bg-white border rounded-lg px-3 py-1 text-sm font-bold outline-none border-indigo-200"
                                                value={editForm.registerNumber || ''}
                                                onChange={(e) => setEditForm({ ...editForm, registerNumber: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-bold text-slate-600">{student.registerNumber || 'N/A'}</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        {editingStudent === student._id ? (
                                            <select
                                                className="bg-white border rounded-lg px-3 py-1 text-sm font-bold outline-none border-indigo-200 cursor-pointer"
                                                value={editForm.department || ''}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                            >
                                                <option value="">Select Dept</option>
                                                {DEPARTMENTS.map((dept) => (
                                                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="font-bold text-slate-600">{student.department || 'N/A'}</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {editingStudent === student._id ? (
                                            <input
                                                type="number"
                                                className="bg-white border rounded-lg px-3 py-1 text-sm font-bold w-16 outline-none border-indigo-200"
                                                value={editForm.semester || ''}
                                                onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                                            />
                                        ) : (
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">SEM {student.semester || '0'}</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>{student.attendancePercentage || 0}%</span>
                                                <span className={student.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}>
                                                    {student.attendancePercentage >= 75 ? 'Safe' : 'Low'}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${student.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${student.attendancePercentage || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {editingStudent === student._id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bg-white border rounded-lg px-3 py-1 text-sm font-bold w-20 outline-none border-indigo-200"
                                                value={editForm.cgpa || ''}
                                                onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                                    <FiAward size={14} />
                                                </div>
                                                <span className="font-black text-slate-900">{student.cgpa ? student.cgpa.toFixed(2) : '0.00'}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end gap-2">
                                            {editingStudent === student._id ? (
                                                <>
                                                    <button onClick={handleUpdate} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        <FiCheckCircle />
                                                    </button>
                                                    <button onClick={() => setEditingStudent(null)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                        <FiX />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleViewDetails(student)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                        <FiEye />
                                                    </button>
                                                    <button onClick={() => handleEdit(student)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => handleDelete(student._id)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                        <FiTrash2 />
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
                        className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
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
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        placeholder="1-8"
                                        value={createForm.semester}
                                        onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                                    />
                                </div>
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
                        className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                    >
                        <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                                <FiX className="text-xl" />
                            </button>
                            <div className="absolute -bottom-16 left-12 p-2 bg-white rounded-[2.5rem]">
                                <div className="w-32 h-32 rounded-[2rem] bg-slate-900 flex items-center justify-center text-4xl text-white font-black shadow-xl">
                                    {selectedStudent.name.charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-24 pb-12 px-12">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedStudent.name}</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedStudent.email}</p>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                    ID: {selectedStudent.registerNumber}
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

                            <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100">
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

export default StudentManagement;
