import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSave, FiSearch, FiUser, FiActivity, FiPlus, FiTrash2,
    FiAward, FiBookOpen, FiClock, FiLayers, FiTriangle, FiX,
    FiCheckCircle, FiTarget, FiPieChart, FiEdit3
} from 'react-icons/fi';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { SUBJECTS_BY_DEPT } from '../utils/subjectData';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const PerformanceManagement = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [semester, setSemester] = useState('1');
    const [semesterGrades, setSemesterGrades] = useState(new Array(8).fill(0));
    const [isEditingGPA, setIsEditingGPA] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (selectedStudent) {
                const subjects = await fetchAvailableSubjects();
                await fetchStudentMarks(selectedStudent._id, subjects);
                setSemesterGrades(selectedStudent.semesterGrades || new Array(8).fill(0));
                setIsEditingGPA(false);
            }
        };
        loadData();
    }, [selectedStudent, semester]);

    const fetchAvailableSubjects = async () => {
        if (!selectedStudent) return [];
        try {
            const { data } = await api.get(`/subjects?semester=${semester}&department=${selectedStudent.department}`);
            const subjects = data.data.map(s => s.name);
            setAvailableSubjects(subjects);
            return subjects;
        } catch (error) {
            console.error('Failed to fetch subjects');
            return [];
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/students');
            setStudents(data?.data || []);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentMarks = async (studentId, currentSubjects = []) => {
        try {
            const { data } = await api.get(`/marks/student/${studentId}`);
            const filteredMarks = (data?.data || []).filter(m => m.semester.toString() === semester.toString());

            let newMarks = [];

            if (filteredMarks.length > 0) {
                newMarks = filteredMarks.map(m => ({
                    _id: m._id,
                    id: m._id, // Stable ID for keys
                    subject: m.subject,
                    score: m.score,
                    semester: m.semester.toString(),
                    isCustom: !currentSubjects.includes(m.subject)
                }));
            }

            const markedSubjects = newMarks.map(m => m.subject);
            const remainingSubjects = currentSubjects.filter(sub => !markedSubjects.includes(sub));

            const emptyFields = remainingSubjects.map(sub => ({
                id: `init-${sub}`, // Deterministic ID for existing subjects
                subject: sub,
                score: '',
                semester: semester.toString(),
                isCustom: false
            }));

            newMarks = [...newMarks, ...emptyFields];

            if (newMarks.length === 0) {
                newMarks = [{ id: Date.now(), subject: '', score: '', semester: semester.toString(), isCustom: false }];
            }

            setMarks(newMarks);
        } catch (error) {
            toast.error('Failed to fetch marks');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addMarkField = () => {
        setMarks([...marks, { id: Date.now() + Math.random(), subject: '', score: '', semester: semester, isCustom: false }]);
    };

    const removeMarkField = async (id) => {
        const markToRemove = marks.find(m => m.id === id);
        if (markToRemove && markToRemove._id) {
            try {
                await api.delete(`/marks/${markToRemove._id}`);
                toast.success('Mark removed successfully');
            } catch (error) {
                toast.error('Failed to remove mark');
                return;
            }
        }
        setMarks(marks.filter(m => m.id !== id));
    };

    const updateMark = (id, field, value) => {
        setMarks(marks.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSave = async () => {
        if (!selectedStudent) return;

        const invalid = marks.some(m => !m.subject || m.score === '');
        if (invalid) {
            toast.error('Please fill all subject and score fields');
            return;
        }

        setSaving(true);
        try {
            await Promise.all(marks.map(mark =>
                api.post('/marks', {
                    studentId: selectedStudent._id,
                    subject: mark.subject,
                    score: Number(mark.score),
                    semester: semester.toString()
                })
            ));

            toast.success('Performance audit successful');
            const subjects = await fetchAvailableSubjects();
            await fetchStudentMarks(selectedStudent._id, subjects);
        } catch (error) {
            toast.error('Failed to update performance records');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateGPA = async () => {
        try {
            await api.put(`/students/${selectedStudent._id}`, {
                semesterGrades: semesterGrades
            });
            toast.success('Semester GPA history updated');
            setIsEditingGPA(false);
            fetchStudents();
            // Update local state
            setSelectedStudent({ ...selectedStudent, semesterGrades: semesterGrades });
        } catch (error) {
            toast.error('Failed to update GPA tracks');
        }
    };

    const getAvailableSubjects = () => {
        return availableSubjects;
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
                        Grade <span className="text-indigo-600">Management</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Manage student marks and academic performance across the institution.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="premium-glass p-8 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden group/explorer">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Search Students</h3>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">Select Student</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment records</p>
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredStudents.map(student => (
                                <motion.button
                                    key={student._id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={clsx(
                                        "w-full p-6 rounded-[2rem] transition-all flex items-center justify-between group",
                                        selectedStudent?._id === student._id
                                            ? "bg-slate-950 text-white shadow-2xl shadow-indigo-500/20"
                                            : "bg-white border border-slate-100 text-slate-600 hover:border-indigo-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                                            selectedStudent?._id === student._id ? "bg-white/10" : "bg-slate-100"
                                        )}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black truncate w-32 uppercase tracking-tight">{student.name}</p>
                                            <p className={clsx("text-[9px] font-bold uppercase tracking-widest", selectedStudent?._id === student._id ? "text-indigo-300" : "text-slate-400")}>
                                                {student.registerNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <FiCheckCircle className={clsx("text-lg", selectedStudent?._id === student._id ? "text-indigo-400" : "opacity-0")} />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Performance Forge */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8"
                >
                    <div className="premium-glass p-10 rounded-[4rem] shadow-2xl relative overflow-hidden h-full group/forge">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover/forge:bg-indigo-500/10 transition-colors duration-700"></div>

                        {selectedStudent ? (
                            <div className="relative z-10 space-y-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-3xl shadow-2xl">
                                            <FiActivity />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedStudent.name}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedStudent.department}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <div className="flex items-center gap-2">
                                                    <FiTarget className="text-slate-400 text-xs" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester</span>
                                                    <select
                                                        value={semester}
                                                        onChange={(e) => setSemester(e.target.value)}
                                                        className="bg-slate-50 border-none rounded-lg px-2 py-1 font-black text-xs text-slate-900 focus:ring-0 appearance-none cursor-pointer"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        <FiSave className="text-lg" /> {saving ? 'Saving...' : 'Save Marks'}
                                    </button>
                                </div>

                                {/* Semester GPA Track & Chart */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Academic Progress</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">GPA Performance History</p>
                                            </div>
                                            <button
                                                onClick={() => isEditingGPA ? handleUpdateGPA() : setIsEditingGPA(true)}
                                                className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isEditingGPA ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                                            >
                                                {isEditingGPA ? 'Save Records' : 'Edit Tracks'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4 mb-8 relative z-10">
                                            {semesterGrades.map((gpa, idx) => (
                                                <div key={idx} className="space-y-1 text-center">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase">Sem {idx + 1}</p>
                                                    {isEditingGPA ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="10"
                                                            placeholder="0.0"
                                                            className="w-full bg-white border border-slate-100 rounded-lg py-2 text-center font-black text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                            value={gpa === 0 ? '' : gpa}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newGrades = [...semesterGrades];
                                                                newGrades[idx] = val === '' ? 0 : parseFloat(val);
                                                                setSemesterGrades(newGrades);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full py-2 bg-slate-50 rounded-lg text-center font-black text-slate-900 text-xs border border-slate-100/50">
                                                            {gpa || '0.0'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="h-[200px] w-full relative z-10 mt-auto">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={semesterGrades.map((gpa, idx) => ({ name: `Sem ${idx + 1}`, gpa })).filter(d => d.gpa > 0)}>
                                                    <defs>
                                                        <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900 }} />
                                                    <YAxis hide />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', padding: '8px' }}
                                                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                    <Area type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#adminChartGradient)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="font-black text-slate-900 tracking-tight">Quick Marks Entry</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem {semester} Academic Details</p>
                                            </div>
                                            <button
                                                onClick={addMarkField}
                                                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-md"
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            <AnimatePresence mode="popLayout">
                                                {marks.map((mark) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={mark.id}
                                                        className="flex items-center gap-3 bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-sm"
                                                    >
                                                        <div className="flex-1">
                                                            {!mark.isCustom ? (
                                                                <select
                                                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all appearance-none"
                                                                    value={mark.subject}
                                                                    onChange={(e) => {
                                                                        if (e.target.value === 'custom') {
                                                                            updateMark(mark.id, 'isCustom', true);
                                                                            updateMark(mark.id, 'subject', '');
                                                                        } else {
                                                                            updateMark(mark.id, 'subject', e.target.value);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">Subject</option>
                                                                    {getAvailableSubjects().map(sub => (
                                                                        <option key={sub} value={sub}>{sub}</option>
                                                                    ))}
                                                                    <option value="custom">+ Other</option>
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    placeholder="Subject name..."
                                                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-black text-slate-700 outline-none"
                                                                    value={mark.subject}
                                                                    onChange={(e) => updateMark(mark.id, 'subject', e.target.value)}
                                                                />
                                                            )}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            className="w-16 bg-white border border-slate-100 rounded-xl py-2 text-center font-black text-slate-900 text-xs"
                                                            value={mark.score}
                                                            onChange={(e) => updateMark(mark.id, 'score', e.target.value)}
                                                        />
                                                        <button
                                                            onClick={() => removeMarkField(mark.id)}
                                                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transition-colors"
                                                        >
                                                            <FiX size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-6">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-4xl shadow-inner">
                                    <FiUser />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">No Student Selected</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Select a student from the list to manage marks</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div >
        </div >
    );
};

export default PerformanceManagement;
