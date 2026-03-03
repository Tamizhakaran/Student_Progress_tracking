import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiClipboard, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Assignments = () => {
    const [assignments] = useState([
        { id: 1, title: 'Data Structures - Binary Trees', subject: 'Computer Science', dueDate: '2026-02-15', status: 'pending', priority: 'high' },
        { id: 2, title: 'Thermodynamics Assignment 3', subject: 'Physics', dueDate: '2026-02-18', status: 'completed', priority: 'medium' },
        { id: 3, title: 'Organic Chemistry Lab Report', subject: 'Chemistry', dueDate: '2026-02-20', status: 'pending', priority: 'medium' },
        { id: 4, title: 'English Literature Essay', subject: 'English', dueDate: '2026-02-22', status: 'pending', priority: 'low' },
        { id: 5, title: 'Calculus Problem Set 5', subject: 'Mathematics', dueDate: '2026-02-14', status: 'overdue', priority: 'high' },
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-rose-600';
            case 'medium': return 'text-amber-600';
            case 'low': return 'text-emerald-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Assignments</h1>
                    <p className="text-slate-500 font-bold text-base mt-2">Track and manage your academic tasks and deadlines.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-morphism p-6 rounded-[2rem] border-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FiClock />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <h3 className="text-2xl font-black text-slate-900">3</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-morphism p-6 rounded-[2rem] border-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
                            <h3 className="text-2xl font-black text-slate-900">1</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-morphism p-6 rounded-[2rem] border-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FiAlertCircle />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overdue</p>
                            <h3 className="text-2xl font-black text-slate-900">1</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="glass-morphism rounded-[2.5rem] border-white shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900">All Assignments</h2>
                </div>
                <div className="p-8">
                    <div className="space-y-4">
                        {assignments.map((assignment, index) => (
                            <motion.div
                                key={assignment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <FiClipboard className="text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{assignment.title}</h3>
                                            <p className="text-sm text-slate-500 font-bold mt-1">{assignment.subject}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <FiClock className="text-slate-400 text-xs" />
                                                <span className="text-xs font-bold text-slate-600">Due: {assignment.dueDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getPriorityColor(assignment.priority)}`}>
                                            {assignment.priority}
                                        </span>
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(assignment.status)}`}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assignments;
