import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiSearch, FiBook, FiLayers, FiLayers as FiSemester, FiShield, FiDatabase, FiCheckCircle, FiX } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { DEPARTMENTS } from '../utils/constants';
import { SUBJECTS_BY_DEPT } from '../utils/subjectData';

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]?.value || '');
    const [newSubject, setNewSubject] = useState({ name: '', code: '' });
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, [selectedSemester, selectedDept]);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/subjects?semester=${selectedSemester}&department=${selectedDept}`);
            setSubjects(data.data);
        } catch (error) {
            toast.error('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.name.trim()) return;

        try {
            await api.post('/subjects', {
                ...newSubject,
                semester: selectedSemester,
                department: selectedDept
            });
            toast.success('Subject added successfully');
            setNewSubject({ name: '', code: '' });
            fetchSubjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add subject');
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;

        try {
            await api.delete(`/subjects/${id}`);
            toast.success('Subject removed');
            fetchSubjects();
        } catch (error) {
            toast.error('Failed to delete subject');
        }
    };

    const handleInitialize = async () => {
        if (!window.confirm('This will populate the database with all default subjects from the static registry. Continue?')) return;

        setIsInitializing(true);
        try {
            const bulkData = [];
            Object.keys(SUBJECTS_BY_DEPT).forEach(dept => {
                const semesters = SUBJECTS_BY_DEPT[dept];
                Object.keys(semesters).forEach(sem => {
                    semesters[sem].forEach(subName => {
                        bulkData.push({
                            name: subName,
                            semester: Number(sem),
                            department: dept
                        });
                    });
                });
            });

            await api.post('/subjects/bulk', { subjects: bulkData });
            toast.success('Database initialized with default subjects');
            fetchSubjects();
        } catch (error) {
            toast.error('Initialization failed');
        } finally {
            setIsInitializing(false);
        }
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
                        Subject <span className="text-indigo-600">Vault</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Configure academic curriculum and manage subjects per department and semester.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleInitialize}
                        disabled={isInitializing}
                        className="px-8 py-5 bg-white text-emerald-600 border-2 border-emerald-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3"
                    >
                        <FiDatabase className="text-lg" /> {isInitializing ? 'Processing...' : 'Initialize Registry'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Semester Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-100/50 rounded-[2.5rem] border border-slate-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <motion.button
                        key={num}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSemester(num)}
                        className={clsx(
                            "px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center gap-2",
                            selectedSemester === num
                                ? "bg-slate-950 text-white shadow-xl scale-110 z-10"
                                : "bg-white text-slate-500 hover:text-slate-950"
                        )}
                    >
                        <FiSemester /> Semester {num}
                    </motion.button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="premium-glass p-8 rounded-[3rem] shadow-2xl space-y-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Configuration</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Scope & Parameters</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer appearance-none shadow-inner"
                                >
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            <form onSubmit={handleAddSubject} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">New Subject Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Machine Learning"
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-md"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject Code (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CS101"
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-md"
                                        value={newSubject.code}
                                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 mt-4"
                                >
                                    <FiPlus className="text-lg" /> Add to Curriculum
                                </motion.button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Subject List */}
                <div className="lg:col-span-8">
                    <div className="premium-glass p-10 rounded-[4rem] shadow-2xl relative overflow-hidden h-full">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-lg border border-indigo-100/50">
                                    <FiBook />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Curriculum</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        Semester {selectedSemester} • {selectedDept}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                <span className="text-2xl font-black text-slate-900">{subjects.length}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Active</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    [1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-32 bg-slate-50 rounded-[2.5rem] animate-pulse border border-slate-100" />
                                    ))
                                ) : subjects.length > 0 ? (
                                    subjects.map((subject) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={subject._id}
                                            className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleDeleteSubject(subject._id)}
                                                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>

                                            <div className="flex flex-col h-full justify-between">
                                                <div>
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-4 border border-indigo-100/50">
                                                        {subject.code || 'NO CODE'}
                                                    </span>
                                                    <h4 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {subject.name}
                                                    </h4>
                                                </div>

                                                <div className="mt-8 flex items-center justify-between text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <FiShield className="text-[10px]" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Registered</span>
                                                    </div>
                                                    <FiCheckCircle className="text-emerald-500" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-32 text-center space-y-6">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                                            <FiLayers className="text-4xl text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-xl tracking-tight">Empty Semester Portfolio</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-10">No subjects have been registered for this configuration yet.</p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for classes
const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default SubjectManagement;
