import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlus, FiTrash2, FiSave, FiCalendar, FiBook, FiLayers, FiX, FiCheckCircle, FiMinusCircle, FiActivity, FiSearch, FiTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { DEPARTMENTS } from '../utils/constants';

const ScheduleManagement = () => {
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
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
            toast.success('Schedule archived successfully');
            fetchSchedules();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sync schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Erase this schedule from institutional record?')) return;
        try {
            await api.delete(`/schedules/${id}`);
            toast.success('Schedule purged');
            fetchSchedules();
        } catch (error) {
            toast.error('Deletion protocol failed');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Lecture': return <FiBook />;
            case 'Lab': return <FiActivity />;
            case 'Seminar': return <FiLayers />;
            case 'Exam': return <FiCheckCircle />;
            case 'Holiday': return <FiMinusCircle />;
            default: return <FiClock />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Lecture': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Lab': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Seminar': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Exam': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Holiday': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
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
                        Schedule <span className="text-indigo-600">Manager</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Manage class schedules and time slots for all departments.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden group">
                    <FiCalendar className="text-indigo-600 text-xl ml-2" />
                    <span className="pr-6 font-black text-slate-800 text-sm uppercase tracking-widest">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Forge Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-5 space-y-8"
                >
                    <div className="premium-glass p-10 rounded-[4rem] shadow-2xl space-y-10 relative overflow-hidden group/forge">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover/forge:bg-indigo-500/10 transition-colors duration-700"></div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-xl shadow-lg">
                                    <FiTriangle className="rotate-180" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Timeline Parameters</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Department Unit</label>
                                    <div className="relative">
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full h-16 bg-white/50 border border-slate-100 rounded-3xl px-6 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Dept</option>
                                            {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                        <FiLayers className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Semester Cycle</label>
                                    <div className="relative">
                                        <select
                                            value={semester}
                                            onChange={(e) => setSemester(e.target.value)}
                                            className="w-full h-16 bg-white/50 border border-slate-100 rounded-3xl px-6 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Sem</option>
                                            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <FiClock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Temporal Target</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full h-16 bg-white/50 border border-slate-100 rounded-3xl px-6 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                                    />
                                    <FiCalendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-slate-100 relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sequence Mapping</h3>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={addSlot}
                                    className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"
                                >
                                    <FiPlus />
                                </motion.button>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {slots.map((slot, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-6 bg-white/40 border border-slate-100 rounded-[2rem] space-y-4 shadow-sm relative group/slot hover:bg-white/60 transition-all"
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="time"
                                                        value={slot.time}
                                                        onChange={(e) => updateSlot(index, 'time', e.target.value)}
                                                        className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-4 text-xs font-black outline-none focus:border-indigo-300 transition-all"
                                                    />
                                                </div>
                                                <div className="w-1/3 relative">
                                                    <select
                                                        value={slot.type}
                                                        onChange={(e) => updateSlot(index, 'type', e.target.value)}
                                                        className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-300 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="Lecture">Lecture</option>
                                                        <option value="Lab">Lab</option>
                                                        <option value="Seminar">Seminar</option>
                                                        <option value="Exam">Exam</option>
                                                        <option value="Holiday">Holiday</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        placeholder="Module Identifier (e.g. AI-901)"
                                                        value={slot.subject}
                                                        onChange={(e) => updateSlot(index, 'subject', e.target.value)}
                                                        className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-4 text-xs font-bold outline-none focus:border-indigo-300 transition-all italic"
                                                    />
                                                </div>
                                                {slots.length > 1 && (
                                                    <button
                                                        onClick={() => removeSlot(index)}
                                                        className="h-12 w-12 flex items-center justify-center text-rose-400 bg-white border border-rose-50 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FiX />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-4 h-20 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-200/20 disabled:opacity-50 relative z-10 overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-white/10 to-indigo-600/0 -translate-x-full group-hover/btn:animate-shimmer"></div>
                            <FiSave className="text-lg" /> {loading ? 'Synchronizing...' : 'Commit to Record'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Registry View */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7 space-y-8"
                >
                    <div className="premium-glass p-10 rounded-[4rem] shadow-2xl min-h-[700px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Temporal Registry</h2>
                                <p className="text-slate-400 font-bold text-sm tracking-tight">Active institutional schedules across all dimensions.</p>
                            </div>
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                                {schedules.length} Records Found
                            </div>
                        </div>

                        <div className="flex-1 relative z-10">
                            {schedules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 text-center">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl text-slate-200 mb-8 animate-pulse">
                                        <FiClock />
                                    </div>
                                    <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-[10px]">No empirical timelines detected</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <AnimatePresence>
                                        {schedules.map((sched) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={sched._id}
                                                className="p-8 bg-white/60 border border-slate-100/50 shadow-xl rounded-[3rem] relative group/card hover:bg-white transition-all duration-500 overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 p-6 flex gap-2 translate-x-12 opacity-0 group-hover/card:translate-x-0 group-hover/card:opacity-100 transition-all duration-500">
                                                    <button
                                                        onClick={() => handleDelete(sched._id)}
                                                        className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-lg shadow-rose-100"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-5 mb-8">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-xl shadow-xl transform group-hover/card:rotate-12 transition-transform duration-500">
                                                        <FiLayers />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{sched.department}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">SEMESTER {sched.semester}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mb-8 text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                                    <FiCalendar className="text-indigo-400" />
                                                    {new Date(sched.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>

                                                <div className="space-y-3 pt-6 border-t border-slate-100/50">
                                                    {sched.slots.map((slot, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 group/row">
                                                            <span className="text-[10px] font-black text-slate-400 w-12 tracking-tighter">{slot.time}</span>
                                                            <div className="flex-1 flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                                                <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{slot.subject}</span>
                                                                <div className={`p-2 rounded-xl text-[10px] transform group-hover/row:scale-110 transition-transform ${getTypeColor(slot.type)}`}>
                                                                    {getTypeIcon(slot.type)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-8 pt-4 flex justify-end">
                                                    <div className="h-1 w-12 bg-slate-100 rounded-full group-hover/card:w-24 bg-gradient-to-r from-indigo-500/50 to-transparent transition-all duration-700"></div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ScheduleManagement;
