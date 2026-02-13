import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiSearch, FiUser, FiActivity, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { SUBJECTS_BY_DEPT } from '../utils/subjectData';

const PerformanceManagement = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [semester, setSemester] = useState('1');

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentMarks(selectedStudent._id);
        }
    }, [selectedStudent, semester]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/students');
            setStudents(data.data);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentMarks = async (studentId) => {
        try {
            const { data } = await api.get(`/marks/student/${studentId}`);
            // Filter marks by current selected semester
            const filteredMarks = data.data.filter(m => m.semester.toString() === semester.toString());

            const availableSubjects = SUBJECTS_BY_DEPT[selectedStudent?.department]?.[semester] || [];

            if (filteredMarks.length > 0) {
                setMarks(filteredMarks.map(m => ({
                    subject: m.subject,
                    score: m.score,
                    semester: m.semester,
                    isCustom: !availableSubjects.includes(m.subject)
                })));
            } else {
                // Initialize with common subjects for that dept/sem if available
                const dept = selectedStudent?.department;
                const defaultSubjects = SUBJECTS_BY_DEPT[dept]?.[semester] || [];

                if (defaultSubjects.length > 0) {
                    setMarks(defaultSubjects.map(sub => ({ subject: sub, score: '', semester: semester, isCustom: false })));
                } else {
                    setMarks([{ subject: '', score: '', semester: semester, isCustom: false }]);
                }
            }
        } catch (error) {
            toast.error('Failed to fetch marks');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addMarkField = () => {
        setMarks([...marks, { subject: '', score: '', semester: semester, isCustom: false }]);
    };

    const removeMarkField = (index) => {
        setMarks(marks.filter((_, i) => i !== index));
    };

    const updateMark = (index, field, value) => {
        const newMarks = [...marks];
        newMarks[index][field] = value;
        setMarks(newMarks);
    };

    const handleSave = async () => {
        if (!selectedStudent) return;

        const invalid = marks.some(m => !m.subject || m.score === '');
        if (invalid) {
            toast.error('Please fill all subject and score fields correctly');
            return;
        }

        setSaving(true);
        try {
            for (const mark of marks) {
                await api.post('/marks', {
                    studentId: selectedStudent._id,
                    subject: mark.subject,
                    score: Number(mark.score),
                    semester: Number(semester)
                });
            }
            toast.success('Marks updated successfully');
        } catch (error) {
            toast.error('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const getAvailableSubjects = () => {
        if (!selectedStudent) return [];
        return SUBJECTS_BY_DEPT[selectedStudent.department]?.[semester] || [];
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance Management</h1>
                    <p className="text-slate-500 font-bold text-sm">Update student subject-wise marks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Student Selection List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="glass-morphism p-6 rounded-3xl border-white shadow-xl space-y-4">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredStudents.map(student => (
                                <button
                                    key={student._id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedStudent?._id === student._id
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedStudent?._id === student._id ? 'bg-white/10' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-black text-xs truncate">{student.name}</p>
                                        <p className={`text-[10px] font-bold ${selectedStudent?._id === student._id ? 'text-indigo-200' : 'text-slate-400'
                                            }`}>{student.registerNumber || 'No Reg Num'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Marks Entry Section */}
                <div className="lg:col-span-8">
                    {selectedStudent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl space-y-6"
                        >
                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                                        <FiUser />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{selectedStudent.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {selectedStudent.department} • {selectedStudent.registerNumber}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                                    <select
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                        className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black uppercase tracking-widest transition-all outline-none focus:border-indigo-200"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s.toString()}>Sem {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Subject Marks</h4>
                                    <button
                                        onClick={addMarkField}
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95 flex items-center gap-2 px-4"
                                    >
                                        <FiPlus /> <span className="text-[10px] font-black uppercase">Add Subject</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {marks.map((mark, index) => (
                                        <div key={index} className="flex flex-col gap-2 p-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                                            <div className="flex gap-4 items-center">
                                                {getAvailableSubjects().length > 0 ? (
                                                    <select
                                                        className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={mark.isCustom ? 'custom' : mark.subject}
                                                        onChange={(e) => {
                                                            if (e.target.value === 'custom') {
                                                                updateMark(index, 'isCustom', true);
                                                                updateMark(index, 'subject', ''); // Clear to let them type
                                                            } else {
                                                                updateMark(index, 'isCustom', false);
                                                                updateMark(index, 'subject', e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select Subject</option>
                                                        {getAvailableSubjects().map(sub => (
                                                            <option key={sub} value={sub}>{sub}</option>
                                                        ))}
                                                        <option value="custom">Other (Manual Entry)</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        placeholder="Subject Name"
                                                        className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={mark.subject}
                                                        onChange={(e) => updateMark(index, 'subject', e.target.value)}
                                                    />
                                                )}

                                                <input
                                                    type="number"
                                                    placeholder="Mark"
                                                    min="0"
                                                    max="100"
                                                    className="w-24 h-12 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={mark.score}
                                                    onChange={(e) => updateMark(index, 'score', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => removeMarkField(index)}
                                                    className="h-12 w-12 flex items-center justify-center text-rose-500 bg-white border border-slate-100 rounded-2xl hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                            {mark.isCustom && (
                                                <input
                                                    placeholder="Type custom subject name here..."
                                                    className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mt-1 animate-in slide-in-from-top-2"
                                                    value={mark.subject}
                                                    onChange={(e) => updateMark(index, 'subject', e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-14 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 mt-8"
                            >
                                <FiSave /> {saving ? 'Saving...' : 'Save Performance Data'}
                            </button>
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <FiActivity size={64} className="mb-6 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-[10px]">Select a student from the left to manage marks</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceManagement;
