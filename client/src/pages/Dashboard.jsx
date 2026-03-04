import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiZap, FiPieChart, FiLayers, FiActivity, FiBook,
    FiTrendingUp, FiCalendar, FiAward, FiClock, FiCheckCircle, FiAlertCircle,
    FiPlus, FiX, FiFileText, FiBriefcase, FiUsers, FiDollarSign
} from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { calcAttendancePercentage } from '../utils/attendanceUtils';

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
    const isAdmin = user?.role === 'Admin';
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

    // Upload Material State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '', description: '', subject: '', category: 'Notes',
        fileUrl: '', department: '', semester: ''
    });

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
            setPlacements(data.data);
        } catch (error) {
            console.error('Failed to fetch placements');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await api.post('/study-materials', uploadForm);
            toast.success('Study material uploaded successfully');
            setIsUploadModalOpen(false);
            setUploadForm({
                title: '', description: '', subject: '', category: 'Notes',
                fileUrl: '', department: '', semester: ''
            });
            // Optionally refresh some stats if needed
            if (isAdmin) fetchStats();
        } catch (error) {
            toast.error('Upload failed');
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
            className="space-y-10 pb-20 px-4 md:px-0"
        >
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-6">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        {getGreeting()}, <span className="text-indigo-600">{user?.name}</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        {isAdmin
                            ? "System overview is active. Real-time statistics show current performance across all departments."
                            : <>Your academic progress is looking <span className="text-slate-900 underline decoration-indigo-500 decoration-4 underline-offset-8">great</span> today.</>
                        }
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 rounded-2xl glass-morphism border-white shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                            <p className="text-xs font-bold text-slate-900">Online</p>
                        </div>
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isAdmin ? (
                    <>
                        <StatCard icon={<LuGraduationCap />} label="Total Students" value={studentCount.toLocaleString()} trend="+12.4%" color="indigo" />
                        <StatCard icon={<FiActivity />} label="Avg Attendance" value={`${attendanceAverage}%`} trend="+2.1%" color="emerald" />
                        <StatCard icon={<FiTrendingUp />} label="CGPA Average" value={cgpaAverage} trend="+0.5" color="purple" />
                        <StatCard icon={<FiCheckCircle />} label="Full Fees Paid" value={fullPaidCount.toLocaleString()} trend="Updated" color="rose" />
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
                                                {p.studentPhoto && p.studentPhoto !== 'no-photo.jpg' ? (
                                                    <img src={p.studentPhoto} alt={p.studentName} className="w-full h-full object-cover" />
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
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Achievements</h3>
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
                                No achievements yet
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
                        <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Students by Department</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={dynamicDeptData.length > 0 ? dynamicDeptData : departmentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {(dynamicDeptData.length > 0 ? dynamicDeptData : departmentData).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#f97316'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {(dynamicDeptData.length > 0 ? dynamicDeptData : departmentData).map((dept, i) => (
                                    <div key={dept.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f97316'][i % 4] }}></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{dept.name}: {dept.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-2 premium-glass p-10 rounded-[3rem] shadow-2xl bg-slate-950 text-white overflow-hidden relative group border-none">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent opacity-50"></div>
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h3 className="text-4xl font-black tracking-tighter leading-none">Quick Actions</h3>
                                        <p className="text-white/50 font-bold text-sm max-w-xs leading-relaxed">Quickly manage students, attendance, and study materials.</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
                                        <FiLayers className="text-indigo-400 text-2xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                                    <Link to="/students"><QuickAction icon={<LuGraduationCap />} label="Directory" color="indigo" /></Link>
                                    <Link to="/attendance"><QuickAction icon={<FiCalendar />} label="Attendance" color="emerald" /></Link>
                                    <div onClick={() => setIsUploadModalOpen(true)} className="w-full cursor-pointer">
                                        <QuickAction icon={<FiPlus />} label="Ingest Data" color="amber" />
                                    </div>
                                    <Link to="/study-materials"><QuickAction icon={<FiBook />} label="Resources" color="rose" /></Link>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-10 rounded-[3rem] border-white shadow-xl relative overflow-hidden bg-white/40">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Top Performers</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Academic Excellence Board</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                    <FiAward className="text-3xl" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {topPerformers.map((s, i) => (
                                    <TopPerformerCard key={s._id} student={s} rank={i + 1} />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col bg-white/40 h-fit self-start">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-2">
                                <FiAlertCircle className="text-rose-500" /> Low Attendance
                            </h3>
                            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                {lowAttendance.map((s, i) => (
                                    <DashboardListItem key={s._id} name={s.name} detail={`${s.attendancePercentage}%`} color="rose" />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-1 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col bg-white/40 h-fit self-start">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-2">
                                <FiTrendingUp className="text-amber-500" /> Critical CGPA
                            </h3>
                            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                {lowCgpa.map((s, i) => (
                                    <DashboardListItem key={s._id} name={s.name} detail={`${s.cgpa?.toFixed(2)} CGPA`} color="amber" />
                                ))}
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

                        <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-10 rounded-[3rem] border-white shadow-xl relative overflow-hidden bg-white/40">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Top Performers</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Academic Excellence Board</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <FiAward className="text-2xl" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {studentTopPerformers.map((student, index) => (
                                    <TopPerformerCard key={student._id} student={student} rank={index + 1} />
                                ))}
                            </div>
                        </motion.div>
                    </>
                )
                }
            </div>

            {/* Upload Modal (Admin Only) */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsUploadModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quick Upload</h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Add new academic resources to the hub.</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resource Title</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="e.g. Unit 1 Notes" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })} placeholder="e.g. Mathematics" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                                    <textarea required rows="3" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all resize-none" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} placeholder="Provide a brief summary of the resource..." />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                                        <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">File URL</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.fileUrl} onChange={e => setUploadForm({ ...uploadForm, fileUrl: e.target.value })} placeholder="Paste file link here..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                                        <input required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.department} onChange={e => setUploadForm({ ...uploadForm, department: e.target.value })} placeholder="e.g. CSE" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Semester</label>
                                        <input required type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-indigo-200 transition-all" value={uploadForm.semester} onChange={e => setUploadForm({ ...uploadForm, semester: e.target.value })} placeholder="1-8" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:scale-[1.02] active:scale-98 transition-all mt-6 flex items-center justify-center gap-3">
                                    <FiCheckCircle size={20} /> Publish Material
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
        1: 'bg-[#d9a416] text-white', // Darker Gold from image
        2: 'bg-[#94a3b8] text-white', // Slate grey for 2nd
        3: 'bg-[#cd7f32] text-white', // Bronze
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
