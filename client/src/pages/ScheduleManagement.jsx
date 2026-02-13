import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlus, FiTrash2, FiSave, FiCalendar, FiBook, FiLayers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { DEPARTMENTS } from '../utils/constants';

const ScheduleManagement = () => {
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([{ time: '', subject: '', type: 'Lecture' }]);
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);

    const departments = DEPARTMENTS;

    const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const { data } = await api.get('/schedules');
            setSchedules(data.data);
        } catch (error) {
            console.error('Failed to fetch schedules');
        }
    };

    const addSlot = () => {
        setSlots([...slots, { time: '', subject: '', type: 'Lecture' }]);
    };

    const removeSlot = (index) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index, field, value) => {
        const newSlots = [...slots];
        newSlots[index][field] = value;
        setSlots(newSlots);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!department || !semester) {
            toast.error('Please select department and semester');
            return;
        }

        setLoading(true);
        try {
            await api.post('/schedules', {
                department,
                semester,
                date,
                slots
            });
            toast.success('Schedule saved successfully');
            fetchSchedules();
            // Reset slots after save? Maybe better to keep them for quick editing for next day
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this schedule?')) return;
        console.log('Attempting to delete schedule with ID:', id);
        try {
            const response = await api.delete(`/schedules/${id}`);
            console.log('Delete response:', response.data);
            toast.success('Schedule deleted');
            fetchSchedules();
        } catch (error) {
            console.error('Delete error:', error);
            const message = error.response?.data?.message || 'Failed to delete schedule';
            toast.error(message);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Schedule Management</h1>
                    <p className="text-slate-500 font-bold text-sm">Create and manage daily class schedules</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-100 uppercase tracking-widest">
                    <FiCalendar /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                    <div className="glass-morphism p-8 rounded-[2rem] border-white shadow-xl space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                                >
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Semester</label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Schedule Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Time Slots</h3>
                                <button
                                    onClick={addSlot}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all"
                                >
                                    <FiPlus />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {slots.map((slot, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 bg-white/50 border border-slate-100 rounded-2xl space-y-3 shadow-sm relative group"
                                        >
                                            <div className="flex gap-2">
                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={(e) => updateSlot(index, 'time', e.target.value)}
                                                    className="flex-1 h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold focus:outline-none"
                                                />
                                                <select
                                                    value={slot.type}
                                                    onChange={(e) => updateSlot(index, 'type', e.target.value)}
                                                    className="w-24 h-10 bg-slate-50 border border-slate-100 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <option value="Lecture">Lecture</option>
                                                    <option value="Lab">Lab</option>
                                                    <option value="Seminar">Seminar</option>
                                                    <option value="Exam">Exam</option>
                                                    <option value="Holiday">Holiday</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Subject Name"
                                                    value={slot.subject}
                                                    onChange={(e) => updateSlot(index, 'subject', e.target.value)}
                                                    className="flex-1 h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold focus:outline-none"
                                                />
                                                {slots.length > 1 && (
                                                    <button
                                                        onClick={() => removeSlot(index)}
                                                        className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
                        >
                            <FiSave /> {loading ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                </motion.div>

                {/* List Section */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                    <div className="glass-morphism p-8 rounded-[2rem] border-white shadow-xl min-h-[600px]">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">Generated Schedules</h2>

                        <div className="space-y-4">
                            {schedules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <FiClock size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No schedules found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {schedules.map((sched) => (
                                        <div key={sched._id} className="p-6 bg-white/50 border border-slate-100 shadow-sm rounded-3xl relative group hover:shadow-md transition-all">
                                            <button
                                                onClick={() => handleDelete(sched._id)}
                                                className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <FiTrash2 />
                                            </button>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">
                                                    <FiLayers />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 tracking-tight">{sched.department}</h4>
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Semester {sched.semester}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500">
                                                <FiCalendar /> {new Date(sched.date).toLocaleDateString()}
                                            </div>

                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                {sched.slots.slice(0, 3).map((slot, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="font-black text-slate-400">{slot.time}</span>
                                                        <span className="font-bold text-slate-900 truncate max-w-[120px]">{slot.subject}</span>
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-black uppercase tracking-tighter">{slot.type}</span>
                                                    </div>
                                                ))}
                                                {sched.slots.length > 3 && (
                                                    <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-widest mt-2">+ {sched.slots.length - 3} more slots</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ScheduleManagement;
