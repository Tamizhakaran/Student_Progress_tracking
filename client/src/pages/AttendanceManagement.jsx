import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiSearch, FiEdit2, FiCheckCircle, FiX, FiFilter, FiUser, FiPlus, FiActivity, FiTrash2, FiClock, FiTriangle, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [markForm, setMarkForm] = useState({ date: new Date().toISOString().split('T')[0], subject: '', semester: '' });
    const [attendanceValues, setAttendanceValues] = useState({});
    const [activeSlot, setActiveSlot] = useState('FN'); // Added for slot selection
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    // Helper to get YYYY-MM-DD in UTC from Date object or ISO string
    const formatUTC = (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';

        // Use UTC methods to ensure T00:00:00Z always maps to the correct string
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Helper to create a UTC midnight ISO string from a "YYYY-MM-DD" string
    const getUTCObject = (dateStr) => {
        if (!dateStr) return null;
        const dateOnly = dateStr.split('T')[0];
        return new Date(`${dateOnly}T00:00:00.000Z`);
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // Refresh marking data if date changes while modal is open
    useEffect(() => {
        if (isMarkModalOpen) {
            fetchStudentsForMarking();
        }
    }, [markForm.date, isMarkModalOpen]);

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

    const fetchStudentsForMarking = async (targetDate) => {
        try {
            const dateToUse = targetDate || markForm.date;
            // Fetch fresh records for pre-filling modal values only
            // NOTE: Do NOT call setAttendance here to avoid race conditions
            // with fetchAttendance() called after bulk submit.
            const attRes = await api.get('/attendance');
            const latestAttendance = attRes.data.data;

            const { data } = await api.get('/students');
            setStudents(data.data);

            const initialValues = {};
            let detectedSemester = 1;

            data.data.forEach(s => {
                const existingFN = latestAttendance.find(a =>
                    (a.student?._id === s._id || a.student === s._id) &&
                    formatUTC(a.date) === dateToUse &&
                    a.slot === 'FN'
                );

                const existingAN = latestAttendance.find(a =>
                    (a.student?._id === s._id || a.student === s._id) &&
                    formatUTC(a.date) === dateToUse &&
                    a.slot === 'AN'
                );

                if (existingFN && existingFN.semester) detectedSemester = existingFN.semester;
                if (existingAN && existingAN.semester) detectedSemester = existingAN.semester;

                initialValues[s._id] = {
                    FN: existingFN ? existingFN.status : 'Present',
                    AN: existingAN ? existingAN.status : 'Present'
                };
            });

            setMarkForm(prev => ({ ...prev, semester: detectedSemester }));
            setAttendanceValues(initialValues);
        } catch (error) {
            toast.error('Initialization error');
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
        try {
            const records = [];
            const currentDate = getUTCObject(markForm.date).toISOString();
            const currentSemester = Number(markForm.semester) || 1;

            Object.keys(attendanceValues).forEach(studentId => {
                const slots = attendanceValues[studentId];
                if (!slots) return;

                // Process Forenoon
                if (activeSlot === 'FN' || activeSlot === 'ALL') {
                    if (slots.FN) {
                        records.push({
                            student: studentId,
                            date: currentDate,
                            slot: 'FN',
                            status: slots.FN,
                            semester: currentSemester
                        });
                    }
                }

                // Process Afternoon
                if (activeSlot === 'AN' || activeSlot === 'ALL') {
                    if (slots.AN) {
                        records.push({
                            student: studentId,
                            date: currentDate,
                            slot: 'AN',
                            status: slots.AN,
                            semester: currentSemester
                        });
                    }
                }
            });

            // DEBUG: log exactly what we are about to send
            console.group(`[AttendanceMark] Submitting ${activeSlot} — ${records.length} records`);
            console.log('activeSlot:', activeSlot);
            console.log('currentDate:', currentDate);
            console.log('records:', JSON.stringify(records, null, 2));
            console.groupEnd();

            if (records.length === 0) {
                toast.warning('No records to update');
                return;
            }

            const response = await api.post('/attendance/bulk', { records });
            console.log('[AttendanceMark] API response:', response.data);

            toast.success(`Success: Marked ${activeSlot === 'ALL' ? 'both sessions' : activeSlot === 'FN' ? 'forenoon' : 'afternoon'} attendance`);
            setIsMarkModalOpen(false);

            // Small delay to allow MongoDB to fully commit, then re-fetch
            await new Promise(resolve => setTimeout(resolve, 300));

            // Re-fetch to update the display with new records
            const freshData = await api.get(isAdmin ? '/attendance' : '/attendance/my-attendance');
            console.log('[AttendanceMark] Fresh attendance count after submit:', freshData.data.data?.length);
            const anCount = freshData.data.data?.filter(r => r.slot === 'AN').length;
            const fnCount = freshData.data.data?.filter(r => r.slot === 'FN').length;
            console.log(`[AttendanceMark] FN records: ${fnCount}, AN records: ${anCount}`);
            setAttendance(freshData.data.data);
            // fetchStudentTotalCount(); // Removed as it is not defined
        } catch (error) {
            console.error('[AttendanceMark] Submission error:', error?.response?.data || error.message);
            toast.error(error?.response?.data?.message || 'Submission failed. Please check your connection.');
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
        if (!searchTerm) {
            const matchesDate = selectedDate ? formatUTC(a.date) === selectedDate : true;
            return matchesDate;
        }

        const matchesSearch =
            (a.student?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.student?.registerNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesDate = selectedDate ? formatUTC(a.date) === selectedDate : true;

        return matchesSearch && matchesDate;
    });

    // Calculate analytics with daily session breakdown
    // Rule: Both sessions present = 1 day | One session = 0.5 days | Neither = 0 days
    const calculateStats = () => {
        const globalGroups = {}; // key: `${studentId}-${dateKey}`
        const institutionalSlots = new Set(); // key: `${dateKey}-${slot}`
        const todayStudentSessions = {}; // { studentId: { FN: bool, AN: bool } }

        const dailySessionCounts = {
            FN: { present: 0, absent: 0 },
            AN: { present: 0, absent: 0 }
        };

        attendance.forEach(record => {
            const dateKey = formatUTC(record.date);
            const studentId = record.student?._id || record.student;
            const globalKey = `${studentId}-${dateKey}`;
            const slot = record.slot || 'FN';

            if (!globalGroups[globalKey]) globalGroups[globalKey] = { FN: null, AN: null };
            globalGroups[globalKey][slot] = record.status;

            // Track unique institutional data
            institutionalSlots.add(`${dateKey}-${slot}`);

            // Today's session counts
            if (dateKey === selectedDate) {
                if (!todayStudentSessions[studentId]) todayStudentSessions[studentId] = { FN: undefined, AN: undefined };

                const isPresent = ['Present', 'Late'].includes(record.status);
                todayStudentSessions[studentId][slot] = isPresent;

                if (slot === 'FN') {
                    if (isPresent) dailySessionCounts.FN.present++;
                    else dailySessionCounts.FN.absent++;
                } else {
                    if (isPresent) dailySessionCounts.AN.present++;
                    else dailySessionCounts.AN.absent++;
                }
            }
        });

        // Global weighted sums
        let totalDaysPresent_Global = 0;
        let totalDaysPossible_Global = 0;
        let totalAbsent_Global = 0;

        Object.values(globalGroups).forEach(group => {
            if (group.FN !== null) {
                totalDaysPossible_Global += 0.5;
                if (['Present', 'Late'].includes(group.FN)) totalDaysPresent_Global += 0.5;
                else totalAbsent_Global += 0.5;
            }
            if (group.AN !== null) {
                totalDaysPossible_Global += 0.5;
                if (['Present', 'Late'].includes(group.AN)) totalDaysPresent_Global += 0.5;
                else totalAbsent_Global += 0.5;
            }
        });

        const institutionalWorkingDays = institutionalSlots.size * 0.5;

        // Today's weighted summaries for the StatCards (Admin uses these for the fresh start)
        const totalPresentToday_Val = (dailySessionCounts.FN.present * 0.5) + (dailySessionCounts.AN.present * 0.5);
        const totalAbsentToday_Val = (dailySessionCounts.FN.absent * 0.5) + (dailySessionCounts.AN.absent * 0.5);

        return {
            overallPercentage: totalDaysPossible_Global > 0
                ? ((totalDaysPresent_Global / totalDaysPossible_Global) * 100).toFixed(1)
                : '100.0',
            cumulative: {
                present: totalDaysPresent_Global,
                absent: totalAbsent_Global,
                workingDays: isAdmin ? institutionalWorkingDays : totalDaysPossible_Global
            },
            today: {
                present: totalPresentToday_Val,
                absent: totalAbsentToday_Val
            },
            daily: {
                fn: dailySessionCounts.FN,
                an: dailySessionCounts.AN
            }
        };
    };

    const stats = calculateStats();

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Attendance <span className="text-indigo-600">Records</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        {isAdmin
                            ? "Track and manage daily student attendance across all subjects."
                            : "View your daily attendance and academic participation records."
                        }
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    {isAdmin && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setActiveSlot('FN');
                                    setMarkForm(prev => ({ ...prev, date: selectedDate }));
                                    setIsMarkModalOpen(true);
                                    fetchStudentsForMarking(selectedDate);
                                }}
                                className="px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3 border border-white/10"
                            >
                                <FiPlus className="text-lg" /> Mark Forenoon
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setActiveSlot('AN');
                                    setMarkForm(prev => ({ ...prev, date: selectedDate }));
                                    setIsMarkModalOpen(true);
                                    fetchStudentsForMarking(selectedDate);
                                }}
                                className="px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3 border border-white/10"
                            >
                                <FiPlus className="text-lg" /> Mark Afternoon
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05, translateY: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClearData}
                                className="px-8 py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-100 transition-all flex items-center gap-3 border border-rose-200"
                            >
                                <FiTrash2 className="text-lg" /> Clear Records
                            </motion.button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Primary Attendance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    icon={<FiCalendar />}
                    label="Total Working Days"
                    value={stats.cumulative.workingDays}
                    sub="Recorded Sessions (Weighted)"
                    color="indigo"
                />
                <StatCard
                    icon={<FiCheckCircle />}
                    label={isAdmin ? "Date-Wise Present" : "Total Present"}
                    value={isAdmin ? stats.today.present : stats.cumulative.present}
                    sub={isAdmin ? "Weighted for Selected Date" : "Cumulative Weighted Days"}
                    color="amber"
                />
                <StatCard
                    icon={<FiX />}
                    label={isAdmin ? "Date-Wise Absent" : "Total Absent"}
                    value={isAdmin ? stats.today.absent : stats.cumulative.absent}
                    sub={isAdmin ? "Weighted for Selected Date" : "Cumulative Weighted Absences"}
                    color="rose"
                />
                <StatCard
                    icon={<FiActivity />}
                    label="Avg Attendance"
                    value={`${stats.overallPercentage}%`}
                    sub="Cumulative Weighted"
                    color="emerald"
                />
            </div>

            {/* Session Specific Breakdown (Admin Only) */}
            {isAdmin && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Session Breakdown</h2>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white/50 p-10 rounded-[3rem] border border-slate-50 shadow-xl flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Forenoon Session</p>
                                <h4 className="text-2xl font-black text-slate-900">Morning Shift</h4>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-600">{stats.daily.fn.present}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Present</p>
                                </div>
                                <div className="w-px h-10 bg-slate-100 self-center"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-rose-500">{stats.daily.fn.absent}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Absent</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/50 p-10 rounded-[3rem] border border-slate-50 shadow-xl flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Afternoon Session</p>
                                <h4 className="text-2xl font-black text-slate-900">Post-Lunch Shift</h4>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-600">{stats.daily.an.present}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Present</p>
                                </div>
                                <div className="w-px h-10 bg-slate-100 self-center"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-rose-500">{stats.daily.an.absent}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Absent</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 w-full group">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find student records..."
                            className="w-full h-16 bg-white border border-slate-100 rounded-[1.5rem] pl-14 pr-6 font-bold text-slate-900 shadow-xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative group w-full md:w-64">
                        <FiCalendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="date"
                            className="w-full h-16 bg-white border border-slate-100 rounded-[1.5rem] pl-14 pr-6 font-bold text-slate-900 shadow-xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none appearance-none"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleClearData}
                        className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] hover:bg-rose-600 hover:text-white transition-all duration-500 shadow-lg shadow-rose-100/50"
                        title="Purge Attendance Vault"
                    >
                        <FiTrash2 className="text-xl" />
                    </button>
                )}
            </div>

            <div className="premium-glass rounded-[3rem] shadow-2xl overflow-hidden border-none relative group">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-10 bg-white shadow-sm">
                            <tr className="bg-slate-50 text-slate-500">
                                {isAdmin && <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Scholastic Identity</th>}
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center">Temporal Mark</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center">Recorded By</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-center">Protocol Status</th>
                                {isAdmin && <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-right">Operations</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {['FN', 'AN'].map(slot => {
                                const slotRecords = filteredAttendance.filter(r => r.slot === slot);
                                if (slotRecords.length === 0) return null;

                                return (
                                    <React.Fragment key={slot}>
                                        <tr className="bg-slate-50/50 border-y border-slate-100/50">
                                            <td colSpan={isAdmin ? 5 : 3} className="px-10 py-3">
                                                <span className={`text-[9px] font-black px-4 py-1.5 rounded-full ${slot === 'FN' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'} uppercase tracking-[0.2em] shadow-sm`}>
                                                    {slot === 'FN' ? 'Forenoon Session' : 'Afternoon Session'}
                                                </span>
                                            </td>
                                        </tr>
                                        {slotRecords.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50/30 transition-all group/row">
                                                {isAdmin && (
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="relative">
                                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xl">
                                                                    {record.student?.name?.charAt(0)}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-lg border border-slate-100">
                                                                    <FiUser className="text-[10px] text-slate-400" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-lg tracking-tight uppercase leading-none mb-1.5">{record.student?.name}</p>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{record.student?.registerNumber}</span>
                                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{record.student?.department}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="py-10 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <FiCalendar className="text-slate-300" />
                                                            <span className="font-black text-slate-700 text-xs uppercase tracking-widest">
                                                                {new Date(record.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-widest`}>
                                                            {record.slot} Session
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    {record.recordedBy ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-black text-slate-900 text-xs uppercase tracking-tight">{record.recordedBy.name}</span>
                                                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{record.recordedBy.role}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">System</span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    {editingId === record._id ? (
                                                        <select
                                                            className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                                                            value={editForm.status}
                                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                        >
                                                            <option value="Present">Present</option>
                                                            <option value="Absent">Absent</option>
                                                            <option value="Late">Late</option>
                                                        </select>
                                                    ) : (
                                                        <StatusBadge status={record.status} />
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-4 group-hover/row:translate-x-0">
                                                            {editingId === record._id ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handleUpdate(record._id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 transition-transform hover:scale-110">
                                                                        <FiCheckCircle />
                                                                    </button>
                                                                    <button onClick={() => setEditingId(null)} className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 transition-transform hover:scale-110">
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
                                                                        className="p-3 bg-white text-slate-400 rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <FiEdit2 />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (window.confirm('Erase this record from temporal history?')) {
                                                                                try {
                                                                                    await api.delete(`/attendance/${record._id}`);
                                                                                    toast.success('Temporal record deleted');
                                                                                    fetchAttendance();
                                                                                } catch (error) {
                                                                                    toast.error('Deletion protocol failed');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-3 bg-white text-rose-400 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <FiTrash2 />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {!loading && filteredAttendance.length === 0 && (
                        <div className="p-32 text-center">
                            <FiCalendar className="mx-auto text-6xl text-slate-100 mb-6 animate-bounce" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No empirical data detected in specified range</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Marking Modal */}
            <AnimatePresence>
                {isMarkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                            onClick={() => setIsMarkModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                        {activeSlot === 'FN' ? 'Forenoon Attendance' : activeSlot === 'AN' ? 'Afternoon Attendance' : 'Both Sessions'}
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">
                                        {new Date(markForm.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsMarkModalOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90 shadow-sm"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            </div>


                            <div className={`flex-1 overflow-hidden flex bg-white`}>
                                {/* Forenoon Column */}
                                {(activeSlot === 'FN' || activeSlot === 'ALL') && (
                                    <div className={`flex-1 flex flex-col min-w-0 border-r border-slate-50`}>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                            {students.map((student) => (
                                                <motion.div
                                                    key={`${student._id}-fn`}
                                                    className="p-4 premium-glass rounded-2xl border-white shadow-md bg-white/60 hover:shadow-lg transition-all"
                                                >
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900/5 text-slate-900 flex items-center justify-center font-black text-xl border border-slate-200 shrink-0">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase truncate leading-tight">{student.name}</h4>
                                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.registerNumber}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 gap-1">
                                                            {['Present', 'Absent', 'Late'].map((status) => {
                                                                const activeColors = {
                                                                    Present: 'bg-emerald-500 text-white shadow-emerald-500/20',
                                                                    Absent: 'bg-rose-500 text-white shadow-rose-500/20',
                                                                    Late: 'bg-amber-500 text-white shadow-amber-500/20'
                                                                };
                                                                return (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => setAttendanceValues(prev => ({
                                                                            ...prev,
                                                                            [student._id]: { ...prev[student._id], FN: status }
                                                                        }))}
                                                                        className={`px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${attendanceValues[student._id]?.FN === status
                                                                            ? `${activeColors[status]} shadow-lg scale-105`
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                                                            }`}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Afternoon Column */}
                                {(activeSlot === 'AN' || activeSlot === 'ALL') && (
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                            {students.map((student) => (
                                                <motion.div
                                                    key={`${student._id}-an`}
                                                    className="p-4 premium-glass rounded-2xl border-white shadow-md bg-white/60 hover:shadow-lg transition-all"
                                                >
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900/5 text-slate-900 flex items-center justify-center font-black text-xl border border-slate-200 shrink-0">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase truncate leading-tight">{student.name}</h4>
                                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.registerNumber}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 gap-1">
                                                            {['Present', 'Absent', 'Late'].map((status) => {
                                                                const activeColors = {
                                                                    Present: 'bg-emerald-500 text-white shadow-emerald-500/20',
                                                                    Absent: 'bg-rose-500 text-white shadow-rose-500/20',
                                                                    Late: 'bg-amber-500 text-white shadow-amber-500/20'
                                                                };
                                                                return (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => setAttendanceValues(prev => ({
                                                                            ...prev,
                                                                            [student._id]: { ...prev[student._id], AN: status }
                                                                        }))}
                                                                        className={`px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${attendanceValues[student._id]?.AN === status
                                                                            ? `${activeColors[status]} shadow-lg scale-105`
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                                                            }`}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-end gap-6">
                                <button
                                    onClick={() => setIsMarkModalOpen(false)}
                                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-950 transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleBulkSubmit}
                                    className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] shadow-2xl hover:shadow-indigo-500/10 transition-all flex items-center gap-3"
                                >
                                    <FiCheckCircle className="text-xl" /> Save Attendance
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Present: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        Absent: 'bg-rose-50 text-rose-600 border-rose-100',
        Late: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm border ${styles[status]}`}>
            {status}
        </span>
    );
};

const StatCard = ({ icon, label, value, sub, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100'
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="premium-glass p-8 rounded-[3rem] shadow-2xl relative group overflow-hidden"
        >
            <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${colors[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-2">{sub}</p>
            </div>
        </motion.div>
    );
};

export default AttendanceManagement;
