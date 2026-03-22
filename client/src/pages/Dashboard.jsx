import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiZap, FiPieChart, FiLayers, FiActivity, FiBook,
    FiTrendingUp, FiCalendar, FiAward, FiClock, FiCheckCircle, FiAlertCircle,
    FiPlus, FiX, FiFileText, FiBriefcase, FiUsers, FiDollarSign, FiAlertTriangle
} from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import { MdCurrencyRupee } from 'react-icons/md';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { calcAttendancePercentage } from '../utils/attendanceUtils';
import { DEPARTMENTS } from '../utils/constants';
import { getMediaURL } from '../utils/mediaUtils';

// Performance data is now dynamic based on student's semester grades

const attendanceData = [
    { name: 'Mon', hours: 6 },
    { name: 'Tue', hours: 7 },
    { name: 'Wed', hours: 5 },
    { name: 'Thu', hours: 8 },
    { name: 'Fri', hours: 6 },
];

const departmentData = [
    { name: 'CSE', value: 450 },
    { name: 'IT', value: 300 },
    { name: 'AI&DS', value: 250 },
    { name: 'ECE', value: 284 },
];

const Dashboard = () => {
    const { user } = useAuth();
    console.log("Dashboard User Role:", user?.role);
    const isAdmin = user?.role?.toLowerCase() === 'admin' || localStorage.getItem('role')?.toLowerCase() === 'admin';
    const [studentCount, setStudentCount] = useState(0);
    const [cgpaAverage, setCgpaAverage] = useState(0);
    const [attendanceAverage, setAttendanceAverage] = useState(0);
    const [studentAttendance, setStudentAttendance] = useState(0);
    const [studentCgpa, setStudentCgpa] = useState(0);
    const [activeGrades, setActiveGrades] = useState(new Array(8).fill(0));
    const [studentRank, setStudentRank] = useState(0);
    const [topPerformers, setTopPerformers] = useState([]);
    const [lowAttendance, setLowAttendance] = useState([]);
    const [lowCgpa, setLowCgpa] = useState([]);
    const [dynamicDeptData, setDynamicDeptData] = useState([]);
    const [studentTopPerformers, setStudentTopPerformers] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState({ slots: [] });
    const [subjectData, setSubjectData] = useState([]);
    const [fullPaidCount, setFullPaidCount] = useState(0);
    const [achievementCount, setAchievementCount] = useState(0);
    const [recentAchievements, setRecentAchievements] = useState([]);
    const [examTimetable, setExamTimetable] = useState([]);
    const [placements, setPlacements] = useState([]);

    const categories = ['All', 'Notes', 'Assignment', 'Question Paper', 'Reference'];

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
        } else {
            fetchStudentStats();
        }

        const interval = setInterval(() => {
            if (isAdmin) {
                fetchStats();
            } else {
                fetchStudentStats();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isAdmin]);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/students');
            const students = data.data;
            setStudentCount(data.count);

            const totalCgpa = students.reduce((acc, s) => acc + (s.cgpa || 0), 0);
            const avgCgpa = students.length > 0 ? (totalCgpa / students.length).toFixed(2) : '0.00';
            setCgpaAverage(avgCgpa);

            const totalAtt = students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0);
            const avgAtt = students.length > 0 ? (totalAtt / students.length).toFixed(1) : '0.0';
            setAttendanceAverage(avgAtt);

            const top = [...students].sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0)).slice(0, 5);
            setTopPerformers(top);

            const lowAtt = students.filter(s => (s.attendancePercentage || 0) < 75);
            setLowAttendance(lowAtt);

            const lowC = students.filter(s => (s.cgpa || 0) < 6.5);
            setLowCgpa(lowC);

            const deptMap = {};
            students.forEach(s => {
                const dept = s.department || 'Unknown';
                deptMap[dept] = (deptMap[dept] || 0) + 1;
            });
            const formattedDept = Object.keys(deptMap).map(name => ({ name, value: deptMap[name] }));
            setDynamicDeptData(formattedDept);

            // Fetch Fee Stats - Grouped by Student
            const feeRes = await api.get('/fees');
            const allFees = feeRes.data.data;

            const studentFeeGroups = allFees.reduce((acc, f) => {
                const studentId = f.student?._id || f.student;
                if (!studentId) return acc;
                if (!acc[studentId]) {
                    acc[studentId] = { total: 0, paid: 0 };
                }
                acc[studentId].total += f.totalAmount || 0;
                acc[studentId].paid += f.paidAmount || 0;
                return acc;
            }, {});

            const paidCount = Object.values(studentFeeGroups).filter(s => s.paid >= s.total && s.total > 0).length;
            setFullPaidCount(paidCount);

            const achRes = await api.get('/achievements/admin/all');
            const pendingAch = achRes.data.data.filter(a => a.status === 'Pending').slice(0, 5);
            setRecentAchievements(pendingAch);

            // Fetch Exams for Admin
            const scheduleRes = await api.get('/schedules');
            const exams = scheduleRes.data.data.reduce((acc, sched) => {
                const dayExams = (sched.slots || [])
                    .filter(s => s.type === 'Exam')
                    .map(s => ({ ...s, date: sched.date }));
                return [...acc, ...dayExams];
            }, []).sort((a, b) => new Date(a.date) - new Date(b.date));
            setExamTimetable(exams);

            fetchPlacements();
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const fetchStudentStats = async () => {
        try {
            const attRes = await api.get('/attendance/my-attendance');
            const records = attRes.data.data;
            // Use two-session rule: FN+AN present = 1 day, one session = 0.5 days
            const percentage = calcAttendancePercentage(records);
            setStudentAttendance(percentage);

            if (user) {
                setStudentCgpa(user.cgpa || 0);
                setActiveGrades(user.semesterGrades || new Array(8).fill(0));
            }

            const rankRes = await api.get('/students/rank');
            setStudentRank(rankRes.data.rank);

            if (!isAdmin) {
                const schedRes = await api.get('/schedules/today');
                console.log('Dashboard Today Schedule:', schedRes.data.data);
                setTodaySchedule(schedRes.data.data);
            }

            const topRes = await api.get('/students/top-performers');
            setStudentTopPerformers(topRes.data.data);

            const marksRes = await api.get('/marks/my-marks');
            if (marksRes.data.data && marksRes.data.data.length > 0) {
                const allMarks = marksRes.data.data;
                // Find the latest semester available in the database
                const latestSemester = Math.max(...allMarks.map(m => Number(m.semester)));

                const filteredMarks = allMarks.filter(m => m.semester.toString() === latestSemester.toString());
                setSubjectData(filteredMarks.map(m => ({
                    subject: m.subject,
                    score: m.score
                })));
            }

            const achievementRes = await api.get('/achievements/stats');
            setAchievementCount(achievementRes.data.verifiedCount);

            const myAchievementsRes = await api.get('/achievements/my');
            setRecentAchievements(myAchievementsRes.data.data.slice(0, 4));

            // Fetch Exams for Student
            const examRes = await api.get('/schedules/my-exams');
            setExamTimetable(examRes.data.data);
            // Fetch Placements
            fetchPlacements();
        } catch (error) {
            console.error('Failed to fetch student stats');
        }
    };

    const fetchPlacements = async () => {
        try {
            const { data } = await api.get('/placements');
            let placementsData = data.data;

            // Only show placement offers updated within the last 24 hours for students
            if (!isAdmin) {
                const now = new Date();
                placementsData = placementsData.filter(p => {
                    if (p.type !== 'Offer') return true; // Keep upcoming companies
                    const updatedTime = new Date(p.updatedAt || p.createdAt || p.date);
                    const hoursDiff = (now - updatedTime) / (1000 * 60 * 60);
                    return hoursDiff <= 24;
                });
            }

            setPlacements(placementsData);
        } catch (error) {
            console.error('Failed to fetch placements');
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 md:space-y-10 pb-20 px-0 md:px-0 pt-2 md:pt-6"
        >
            {/* Greeting Section */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 py-4 md:py-6">
                <div className="space-y-2 md:space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                        {getGreeting()}, <span className="text-indigo-600 block sm:inline">{user?.name}</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm md:text-base max-w-2xl leading-relaxed">
                        {isAdmin
                            ? "Here's an overview of the academic performance across your departments."
                            : <>Your academic progress is looking <span className="text-slate-900 underline decoration-indigo-500 decoration-4 underline-offset-8">great</span> today.</>}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl glass-morphism border-white shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="text-right">
                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                            <p className="text-[10px] md:text-xs font-bold text-slate-900">Online</p>
                        </div>
                        <div className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-indigo-600"></span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isAdmin ? (
                    <>
                        <StatCard icon={<FiUsers />} label="Total Students" value={studentCount} trend="+12.4%" color="indigo" />
                        <StatCard icon={<FiActivity />} label="Avg Attendance" value={`${attendanceAverage}%`} trend="+2.1%" color="emerald" />
                        <StatCard icon={<FiPieChart />} label="CGPA Average" value={cgpaAverage} trend="+0.5" color="purple" />
                        <StatCard icon={<MdCurrencyRupee />} label="Full Fees Paid" value={fullPaidCount} trend="Updated" color="rose" />
                    </>
                ) : (
                    <>
                        <StatCard icon={<FiAward />} label="Current CGPA" value={studentCgpa ? studentCgpa.toFixed(2) : '0.00'} trend="+0.18" color="indigo" />
                        <StatCard icon={<FiCalendar />} label="Attendance" value={`${studentAttendance}%`} trend="-0.5%" color="emerald" />
                        <StatCard icon={<FiCheckCircle />} label="Achievements" value={achievementCount} trend="Verified" color="purple" />
                        <StatCard icon={<FiActivity />} label="Current Rank" value={`#${studentRank}`} trend="Top 5%" color="rose" />
                    </>
                )}
            </motion.div>

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Students by Department */}
                    <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-white flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Students by Department</h3>
                        </div>
                        <div className="h-[200px] flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dynamicDeptData.length > 0 ? dynamicDeptData : [{ name: 'Loading', value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {dynamicDeptData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4 overflow-y-auto max-h-[100px] custom-scrollbar">
                            {dynamicDeptData.map((dept, idx) => (
                                <div key={dept.name} className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'][idx % 5] }}></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{dept.name}:</span>
                                        <span className="text-xs font-black text-slate-900 leading-tight">{dept.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-10 rounded-[3rem] border-white shadow-xl relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                                <FiLayers size={24} />
                            </div>
                        </div>
                        <div className="relative z-10 max-w-sm mb-10">
                            {/* Uses a CSS trick to render the exact outlined text effect from the screenshot */}
                            <h3 className="text-4xl font-black tracking-tighter mb-2 text-white drop-shadow-sm" style={{ WebkitTextStroke: '2px #e2e8f0' }}>Quick Actions</h3>
                            <p className="text-sm font-bold text-slate-400">Quickly manage students, attendance, and study materials.</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mt-auto">
                            <Link to="/students">
                                <div className="h-full bg-indigo-100/50 hover:bg-indigo-100 border border-indigo-200/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:-translate-y-1">
                                    <LuGraduationCap className="text-indigo-500 text-2xl" />
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">Directory</span>
                                </div>
                            </Link>
                            <Link to="/attendance">
                                <div className="h-full bg-emerald-100/50 hover:bg-emerald-100 border border-emerald-200/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:-translate-y-1">
                                    <FiCalendar className="text-emerald-500 text-2xl" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Attendance</span>
                                </div>
                            </Link>
                            <Link to="/performance-management">
                                <div className="h-full bg-amber-100/50 hover:bg-amber-100 border border-amber-200/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:-translate-y-1">
                                    <FiPlus className="text-amber-500 text-2xl" />
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Ingest Data</span>
                                </div>
                            </Link>
                            <Link to="/study-materials">
                                <div className="h-full bg-rose-100/50 hover:bg-rose-100 border border-rose-200/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:-translate-y-1">
                                    <FiBook className="text-rose-500 text-2xl" />
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center">Resources</span>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants} className="glass-morphism p-10 rounded-[3rem] border-white shadow-xl bg-white/40 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Upcoming Companies</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Next recruiting drives</p>
                            </div>
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <FiBriefcase size={24} />
                            </div>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {placements.filter(p => p.type === 'Upcoming').length > 0 ? (
                                placements.filter(p => p.type === 'Upcoming').map(p => (
                                    <div key={p._id} className="p-6 rounded-[2rem] bg-white/60 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-slate-900">{p.companyName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.role}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{p.eligibility}</div>
                                            {p.companyUrl && (
                                                <a href={p.companyUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Visit Site</a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-40 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No upcoming drives</div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-morphism p-10 rounded-[3rem] border-white shadow-xl bg-white/40 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Placement Offers</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Our hall of fame</p>
                            </div>
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <FiUsers size={24} />
                            </div>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {placements.filter(p => p.type === 'Offer').length > 0 ? (
                                placements.filter(p => p.type === 'Offer').map(p => (
                                    <div key={p._id} className="p-6 rounded-[2rem] bg-white/60 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                                                 {(p.studentPhoto && p.studentPhoto !== 'no-photo.jpg' && getMediaURL(p.studentPhoto)) ? (
                                                     <img
                                                         src={getMediaURL(p.studentPhoto)}
                                                         alt={p.studentName}
                                                         className="w-full h-full object-cover"
                                                         onError={(e) => {
                                                             e.target.onerror = null;
                                                             e.target.parentElement.innerHTML = `<div class="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">${p.studentName?.charAt(0)}</div>`;
                                                         }}
                                                     />
                                                 ) : (
                                                     <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">
                                                         {p.studentName?.charAt(0)}
                                                     </div>
                                                 )}
                                             </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-900 text-sm truncate">{p.studentName}</h4>
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{p.companyName} • {p.department}</p>
                                                    {p.companyUrl && (
                                                        <>
                                                            <span className="text-slate-200">•</span>
                                                            <a href={p.companyUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-widest shrink-0">Site</a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1">
                                                <span className="text-xs font-black">₹</span>
                                                <span className="text-[10px] font-black">{p.salaryPackage}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-40 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No offers yet</div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{isAdmin ? 'Pending Verification' : 'Achievements'}</h3>
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <FiAward />
                        </div>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {recentAchievements.length > 0 ? recentAchievements.map((ach) => (
                            <ActivityItem
                                key={ach._id}
                                title={ach.certificationName}
                                desc={isAdmin ? ach.student?.name : ach.eventName}
                                time={new Date(ach.date).toLocaleDateString()}
                                status={ach.status}
                                color={ach.status === 'Verified' ? 'emerald' : 'indigo'}
                            />
                        )) : (
                            <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                {isAdmin ? 'No pending verifications' : 'No achievements yet'}
                            </div>
                        )}
                    </div>
                    <Link to={isAdmin ? "/achievement-management" : "/achievements"}>
                        <motion.button whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-slate-200">
                            {isAdmin ? 'Manage All' : 'Submit Achievement'}
                        </motion.button>
                    </Link>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isAdmin ? (
                    <>
                        <motion.div variants={itemVariants} className="lg:col-span-3 glass-morphism p-10 rounded-[3rem] border-white shadow-xl relative overflow-hidden bg-white/40">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Top Performers</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Across all departments</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <FiAward className="text-2xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topPerformers.map((student, index) => (
                                    <TopPerformerCard key={student._id} student={student} rank={index + 1} />
                                ))}
                            </div>
                        </motion.div>

                        {/* Critical CGPA & Low Attendance */}
                        <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Critical CGPA Panel */}
                            <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-white/40 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Critical CGPA</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Students with CGPA &lt; 6.5</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                        <FiAlertTriangle size={22} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-scroll max-h-[320px] pr-1 custom-scrollbar">
                                    {lowCgpa.length > 0 ? lowCgpa.map(s => (
                                        <div key={s._id} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100 hover:bg-rose-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-base shrink-0">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-tight">{s.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.department}</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black shrink-0">
                                                {(s.cgpa || 0).toFixed(2)} CGPA
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">All students above threshold 🎉</div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total at risk</span>
                                    <span className="text-lg font-black text-rose-600">{lowCgpa.length}</span>
                                </div>
                            </div>

                            {/* Low Attendance Panel */}
                            <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-white/40 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Low Attendance</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Students with attendance &lt; 75%</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                        <FiAlertTriangle size={22} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-scroll max-h-[320px] pr-1 custom-scrollbar">
                                    {lowAttendance.length > 0 ? lowAttendance.map(s => (
                                        <div key={s._id} className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-base shrink-0">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-tight">{s.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.department}</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black shrink-0">
                                                {(s.attendancePercentage || 0).toFixed(1)}%
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">All students above 75% 🎉</div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total at risk</span>
                                    <span className="text-lg font-black text-amber-600">{lowAttendance.length}</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-8 md:p-10 rounded-[2.5rem] border-white relative overflow-hidden flex flex-col shadow-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic Progress</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed performance history</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['Semester', 'Monthly', 'Weekly'].map(opt => (
                                            <button key={opt} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-100 shadow-sm">
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-[380px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activeGrades?.map((gpa, idx) => ({ name: `Sem ${idx + 1}`, gpa })).filter(d => d.gpa > 0) || []}>
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dx={-15} />
                                            <Tooltip
                                                cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px 24px' }}
                                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                                                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#chartGradient)" animationDuration={2500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-white/40">
                            <h3 className="text-2xl font-black text-slate-900 mb-6">Subject Performance</h3>
                            <div className="h-[340px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectData} margin={{ bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis
                                            dataKey="subject"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={(props) => {
                                                const { x, y, payload } = props;
                                                const words = payload.value.split(' ');
                                                const mid = Math.ceil(words.length / 2);
                                                const line1 = words.slice(0, mid).join(' ');
                                                const line2 = words.slice(mid).join(' ');
                                                return (
                                                    <g transform={`translate(${x},${y})`}>
                                                        <text x={0} y={0} dy={14} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={900}>
                                                            {line1}
                                                        </text>
                                                        {line2 && (
                                                            <text x={0} y={0} dy={26} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={900}>
                                                                {line2}
                                                            </text>
                                                        )}
                                                    </g>
                                                );
                                            }}
                                            height={70}
                                            interval={0}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', shadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px 24px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                                            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="score" fill="#6366f1" radius={[12, 12, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-1 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl relative overflow-hidden bg-white/40">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Schedule</h3>
                                <FiClock className="text-slate-400" />
                            </div>
                            <div className="space-y-4">
                                {todaySchedule.slots && todaySchedule.slots.length > 0 ? (
                                    todaySchedule.slots.map((slot, index) => (
                                        <ScheduleItem
                                            key={index}
                                            time={slot.time}
                                            subject={slot.subject}
                                            type={slot.type}
                                            color={slot.type === 'Lab' ? 'emerald' : slot.type === 'Exam' ? 'rose' : 'indigo'}
                                        />
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        No schedule assigned for today
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    );
};

// Sub-components
const StatCard = ({ icon, label, value, trend, color }) => {
    const colorSchemes = {
        indigo: 'from-indigo-600/20 to-purple-600/5 text-indigo-600 bg-indigo-50/50 border-indigo-100/50 shadow-indigo-100/20',
        emerald: 'from-emerald-600/20 to-teal-600/5 text-emerald-600 bg-emerald-50/50 border-emerald-100/50 shadow-emerald-100/20',
        purple: 'from-purple-600/20 to-pink-600/5 text-purple-600 bg-purple-50/50 border-purple-100/50 shadow-purple-100/20',
        rose: 'from-rose-600/20 to-orange-600/5 text-rose-600 bg-rose-50/50 border-rose-100/50 shadow-rose-100/20',
    };

    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            className="premium-glass p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl transition-all duration-500"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colorSchemes[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-3xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 backdrop-blur-md border border-white/40 ${colorSchemes[color].split(' ').slice(2, 4).join(' ')}`}>
                {icon}
            </div>
            <div className="space-y-2 relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <div className="flex items-end justify-between gap-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
                    <div className="px-3 py-1.5 rounded-xl bg-white/50 border border-white flex items-center gap-1 shrink-0 shadow-sm backdrop-blur-sm">
                        <span className={`${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'} text-[10px] font-black tracking-tight`}>{trend}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ActivityItem = ({ title, desc, time, status, color }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all transform group-hover:rotate-6 ${colors[color] || colors.indigo}`}>
                <FiAward size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h5 className="text-sm font-black text-slate-800 truncate tracking-tight">{title}</h5>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-0.5">{desc}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'Pending' ? 'text-amber-600' : (colors[color] || colors.indigo).split(' ')[1]}`}>{status}</span>
                <span className="text-[10px] font-bold text-slate-300">{time}</span>
            </div>
        </div>
    );
};

const QuickAction = ({ icon, label, color }) => {
    const colors = {
        indigo: 'group-hover:bg-indigo-500/20 group-hover:text-indigo-400',
        emerald: 'group-hover:bg-emerald-500/20 group-hover:text-emerald-400',
        amber: 'group-hover:bg-amber-500/20 group-hover:text-amber-400',
        rose: 'group-hover:bg-rose-500/20 group-hover:text-rose-400'
    };
    return (
        <motion.button whileHover={{ y: -5, scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 transition-all w-full ${colors[color]}`}>
            <div className="text-2xl">{icon}</div>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </motion.button>
    );
};

const ScheduleItem = ({ time, subject, type, color, date }) => {
    const colors = {
        indigo: 'border-indigo-500 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50',
        emerald: 'border-emerald-500 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50',
        purple: 'border-purple-500 bg-purple-50/30 text-purple-700 hover:bg-purple-50',
        rose: 'border-rose-500 bg-rose-50/30 text-rose-700 hover:bg-rose-50',
    };
    return (
        <motion.div
            whileHover={{ x: 5 }}
            className={`flex items-start gap-5 p-5 rounded-2xl border-l-[6px] ${colors[color] || colors.indigo} bg-white shadow-sm transition-all border border-slate-100/50 hover:shadow-md cursor-default group w-full`}
        >
            <div className="min-w-[80px] space-y-1">
                <span className="text-xs font-black text-slate-900 block tracking-tight">{time}</span>
                {date && <span className="text-[8px] font-bold text-indigo-400 block">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{subject}</h4>
            </div>
        </motion.div>
    );
};

const DashboardListItem = ({ name, detail, color }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${colors[color]} shadow-sm`}>
            <span className="text-xs font-black truncate max-w-[120px]">{name}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">{detail}</span>
        </div>
    );
};

const TopPerformerCard = ({ student, rank }) => {
    const rankColors = {
        1: 'bg-[#d9a416] text-white',
        2: 'bg-[#94a3b8] text-white',
        3: 'bg-[#cd7f32] text-white',
    };

    return (
        <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-white border border-slate-50 shadow-sm hover:shadow-lg transition-all group/card">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md transition-transform group-hover/card:scale-110 ${rankColors[rank] || 'bg-slate-50 text-slate-400'}`}>
                {rank}
            </div>
            <div className="flex-1">
                <h4 className="font-black text-slate-900 text-lg leading-tight">{student.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">{student.department || 'MECHANICAL ENGINEERING'}</p>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-indigo-50/50 text-indigo-600 font-extrabold text-xs tracking-wide">
                {student.cgpa?.toFixed(2)} CGPA
            </div>
        </div>
    );
};

export default Dashboard;
