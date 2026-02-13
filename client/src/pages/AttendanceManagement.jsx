import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiSearch, FiEdit2, FiCheckCircle, FiX, FiFilter, FiUser, FiPlus, FiActivity, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [selectedDate, setSelectedDate] = useState(''); // Date filter state
    const [students, setStudents] = useState([]); // All registered students for marking
    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [markForm, setMarkForm] = useState({ date: new Date().toISOString().split('T')[0], subject: '', semester: '' });
    const [attendanceValues, setAttendanceValues] = useState({}); // { studentId: 'Present' }
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const endpoint = isAdmin ? '/attendance' : '/attendance/my-attendance';
            const { data } = await api.get(endpoint);
            setAttendance(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load attendance records');
            setLoading(false);
        }
    };

    const fetchStudentsForMarking = async () => {
        try {
            const { data } = await api.get('/students');
            setStudents(data.data);
            // Initialize all as Present
            const initialValues = {};
            data.data.forEach(s => initialValues[s._id] = 'Present');
            setAttendanceValues(initialValues);
        } catch (error) {
            toast.error('Failed to load students');
        }
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/attendance/${id}`, editForm);
            toast.success('Attendance updated');
            setEditingId(null);
            fetchAttendance();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleBulkSubmit = async () => {
        if (!markForm.subject) return toast.error('Please enter a subject');

        try {
            const records = Object.keys(attendanceValues).map(studentId => ({
                studentId,
                date: markForm.date,
                status: attendanceValues[studentId],
                subject: markForm.subject,
                semester: markForm.semester || 1
            }));

            await api.post('/attendance/bulk', { records });
            toast.success('Daily attendance marked successfully');
            setIsMarkModalOpen(false);
            fetchAttendance();
        } catch (error) {
            toast.error('Bulk update failed');
        }
    };

    const handleClearData = async () => {
        if (window.confirm('WARNING: This will delete ALL attendance records permanently. Are you sure?')) {
            try {
                await api.delete('/attendance');
                toast.success('All attendance data cleared');
                fetchAttendance();
            } catch (error) {
                toast.error('Failed to clear data');
            }
        }
    };

    const filteredAttendance = attendance.filter(a => {
        const matchesSearch = a.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.student?.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = selectedDate ? new Date(a.date).toISOString().split('T')[0] === selectedDate : true;

        return matchesSearch && matchesDate;
    });

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        late: attendance.filter(a => a.status === 'Late').length,
        percentage: attendance.length > 0
            ? ((attendance.filter(a => ['Present', 'Late'].includes(a.status)).length / attendance.length) * 100).toFixed(1)
            : '0.0'
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {isAdmin ? 'Attendance Management' : 'My Attendance History'}
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">
                        {isAdmin ? 'Access and update all student attendance data.' : 'View your daily attendance history.'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => {
                                    setIsMarkModalOpen(true);
                                    fetchStudentsForMarking();
                                }}
                                className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <FiPlus /> Mark Daily Attendance
                            </button>
                            <button
                                onClick={handleClearData}
                                className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm shadow-sm hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <FiX /> Clear Data
                            </button>
                        </>
                    )}
                    <div className="relative group">
                        <input
                            type="date"
                            className="px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-indigo-200 shadow-sm transition-all font-bold text-sm text-slate-600"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="relative group w-full md:w-96">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={isAdmin ? "Search student, subject or Reg No..." : "Search subject..."}
                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-indigo-200 shadow-sm transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Student Stats Summary */}
            {!isAdmin && attendance.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard label="Overall Attendance" value={`${stats.percentage}%`} color="indigo" />
                    <StatCard label="Classes Attended" value={stats.present + stats.late} color="emerald" />
                    <StatCard label="Classes Missed" value={stats.absent} color="rose" />
                    <StatCard label="Total Records" value={stats.total} color="purple" />
                </div>
            )}

            <div className="glass-morphism rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                {isAdmin && <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>}
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                {isAdmin && <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAttendance.map((record) => (
                                <tr key={record._id} className="hover:bg-slate-50/50 transition-all group">
                                    {isAdmin && (
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                                    {record.student?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-none mb-1">{record.student?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.student?.registerNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <span className="font-bold text-slate-600 italic">"{record.subject}"</span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {editingId === record._id ? (
                                            <select
                                                className="bg-white border rounded-lg px-3 py-1 text-xs font-black outline-none border-indigo-200"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Late">Late</option>
                                            </select>
                                        ) : (
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                record.status === 'Absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {record.status}
                                            </span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-8 py-6 text-right">
                                            {editingId === record._id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdate(record._id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        <FiCheckCircle />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(record._id);
                                                            setEditForm({ status: record.status });
                                                        }}
                                                        className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Delete this attendance record?')) {
                                                                try {
                                                                    await api.delete(`/attendance/${record._id}`);
                                                                    toast.success('Record deleted');
                                                                    fetchAttendance();
                                                                } catch (error) {
                                                                    toast.error('Delete failed');
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && filteredAttendance.length === 0 && (
                        <div className="p-20 text-center">
                            <FiCalendar className="mx-auto text-4xl text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No attendance records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mark Daily Attendance Modal (Admin Only) */}
            {isMarkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setIsMarkModalOpen(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-10 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mark Daily Attendance</h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Select subject and mark presence for all students.</p>
                                </div>
                                <button onClick={() => setIsMarkModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Attendance Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        value={markForm.date}
                                        onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject Name</label>
                                    <input
                                        placeholder="e.g. Data Structures"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        value={markForm.subject}
                                        onChange={(e) => setMarkForm({ ...markForm, subject: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Semester</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all"
                                        value={markForm.semester}
                                        onChange={(e) => setMarkForm({ ...markForm, semester: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-slate-50/50">
                            {students.map((student) => (
                                <div key={student._id} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 leading-none mb-1">{student.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.registerNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        {['Present', 'Absent', 'Late'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setAttendanceValues({ ...attendanceValues, [student._id]: status })}
                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${attendanceValues[student._id] === status
                                                    ? 'bg-white text-indigo-600 shadow-sm scale-110'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-10 bg-white border-t border-slate-100 flex justify-end gap-4">
                            <button
                                onClick={() => setIsMarkModalOpen(false)}
                                className="px-8 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkSubmit}
                                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
                            >
                                <FiCheckCircle /> Confirm & Submit Attendance
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, color }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100'
    };

    return (
        <div className={`p-6 rounded-[2rem] border glass-morphism shadow-sm ${colors[color]}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
            <h3 className="text-2xl font-black tracking-tight">{value}</h3>
        </div>
    );
};

export default AttendanceManagement;
