import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiZap, FiPieChart, FiLayers, FiActivity, FiBook,
    FiTrendingUp, FiCalendar, FiAward, FiClock, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import api from '../utils/api';

// Mock Data for Visuals
const performanceData = [
    { name: 'Sem 1', gpa: 7.2 },
    { name: 'Sem 2', gpa: 7.5 },
    { name: 'Sem 3', gpa: 8.1 },
    { name: 'Sem 4', gpa: 7.9 },
    { name: 'Sem 5', gpa: 8.4 },
];

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
    const [studentRank, setStudentRank] = useState(0);
    const [topPerformers, setTopPerformers] = useState([]);
    const [lowAttendance, setLowAttendance] = useState([]);
    const [lowCgpa, setLowCgpa] = useState([]);
    const [dynamicDeptData, setDynamicDeptData] = useState([]);
    const [studentTopPerformers, setStudentTopPerformers] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState({ slots: [] });
    const [subjectData, setSubjectData] = useState([]);

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

            const lowAtt = students.filter(s => (s.attendancePercentage || 0) < 75).slice(0, 5);
            setLowAttendance(lowAtt);

            const lowC = students.filter(s => (s.cgpa || 0) < 6.0).slice(0, 5);
            setLowCgpa(lowC);

            const deptMap = {};
            students.forEach(s => {
                const dept = s.department || 'Unknown';
                deptMap[dept] = (deptMap[dept] || 0) + 1;
            });
            const formattedDept = Object.keys(deptMap).map(name => ({ name, value: deptMap[name] }));
            setDynamicDeptData(formattedDept);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const fetchStudentStats = async () => {
        try {
            const attRes = await api.get('/attendance/my-attendance');
            const records = attRes.data.data;
            const total = records.length;
            const present = records.filter(r => ['Present', 'Late'].includes(r.status)).length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            setStudentAttendance(percentage);

            const userRes = await api.get('/auth/me');
            setStudentCgpa(userRes.data.cgpa || 0);

            const rankRes = await api.get('/students/rank');
            setStudentRank(rankRes.data.rank);

            const schedRes = await api.get('/schedules/today');
            console.log('Dashboard Today Schedule:', schedRes.data.data);
            setTodaySchedule(schedRes.data.data);

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
        } catch (error) {
            console.error('Failed to fetch student stats');
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
            className="space-y-10 pb-20 px-4 md:px-0 bg-slate-50/30"
        >
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-6">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name}</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base md:text-lg max-w-2xl">
                        {isAdmin
                            ? "System operations are stable and student records are performing optimally."
                            : <>Your academic progress is looking <span className="text-slate-900 underline decoration-indigo-500 decoration-2 underline-offset-4">great</span> today.</>
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
                        <StatCard icon={<FiBook />} label="Active Courses" value="124" trend="stable" color="rose" />
                    </>
                ) : (
                    <>
                        <StatCard icon={<FiAward />} label="Current CGPA" value={studentCgpa ? studentCgpa.toFixed(2) : '0.00'} trend="+0.18" color="indigo" />
                        <StatCard icon={<FiCalendar />} label="Attendance" value={`${studentAttendance}%`} trend="-0.5%" color="emerald" />
                        <StatCard icon={<FiClock />} label="Hours Studied" value="42.5h" trend="+4.2h" color="purple" />
                        <StatCard icon={<FiActivity />} label="Current Rank" value={`#${studentRank}`} trend="Top 5%" color="rose" />
                    </>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            <AreaChart data={performanceData}>
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

                <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <FiActivity />
                        </div>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <ActivityItem title="Exam Metadata Updated" desc="Advanced Computation" time="14m ago" status="NEW" color="indigo" />
                        <ActivityItem title="Attendance Sync" desc="Machine Learning L4" time="2h ago" status="OK" color="emerald" />
                        <ActivityItem title="Submission Received" desc="Cloud Infrastructure" time="5h ago" status="IN" color="purple" />
                        <ActivityItem title="System Alert" desc="Maintenance Window" time="Yesterday" status="INFO" color="indigo" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-slate-200">
                        View All Activity
                    </motion.button>
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

                        <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight mb-2 italic">Control Center</h3>
                                        <p className="text-white/60 font-bold text-sm max-w-sm">Manage the academic ecosystem with precision and peak efficiency.</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                        <FiAward className="text-indigo-400 text-xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                                    <Link to="/students"><QuickAction icon={<LuGraduationCap />} label="Students" color="indigo" /></Link>
                                    <Link to="/attendance"><QuickAction icon={<FiCalendar />} label="Attendance" color="emerald" /></Link>
                                    <Link to="/study-materials"><QuickAction icon={<FiBook />} label="Resources" color="amber" /></Link>
                                    <QuickAction icon={<FiPieChart />} label="Analytics" color="rose" />
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

                        <motion.div variants={itemVariants} className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col bg-white/40">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-2">
                                <FiAlertCircle className="text-rose-500" /> Low Attendance
                            </h3>
                            <div className="space-y-3">
                                {lowAttendance.map((s, i) => (
                                    <DashboardListItem key={s._id} name={s.name} detail={`${s.attendancePercentage}%`} color="rose" />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-1 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl flex flex-col bg-white/40">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-2">
                                <FiTrendingUp className="text-amber-500" /> Critical CGPA
                            </h3>
                            <div className="space-y-3">
                                {lowCgpa.map((s, i) => (
                                    <DashboardListItem key={s._id} name={s.name} detail={`${s.cgpa?.toFixed(2)} CGPA`} color="amber" />
                                ))}
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <>
                        <motion.div variants={itemVariants} className="lg:col-span-3 glass-morphism p-10 rounded-[3rem] border-white shadow-xl relative overflow-hidden bg-white/40">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Learning Roadmap</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Your journey to academic excellence</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 font-black text-xs text-indigo-600">
                                    Semester {user?.semester || '1'} Progress: 64%
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block z-0"></div>
                                <RoadmapMilestone icon={<FiCheckCircle />} label="Semester Start" date="Jan 15" status="completed" />
                                <RoadmapMilestone icon={<FiActivity />} label="Mid-Terms" date="Mar 10" status="active" />
                                <RoadmapMilestone icon={<FiAward />} label="Final Exams" date="May 20" status="upcoming" />
                                <RoadmapMilestone icon={<FiActivity />} label="Placement Feed" date="Jun 05" status="upcoming" />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-2 glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl bg-white/40">
                            <h3 className="text-2xl font-black text-slate-900 mb-6">Subject Performance</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis
                                            dataKey="subject"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                            angle={-30}
                                            textAnchor="end"
                                            height={80}
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
        </motion.div>
    );
};

// Sub-components
const StatCard = ({ icon, label, value, trend, color }) => {
    const colorSchemes = {
        indigo: 'from-indigo-500/10 to-transparent text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'from-emerald-500/10 to-transparent text-emerald-600 bg-emerald-50 border-emerald-100',
        purple: 'from-purple-500/10 to-transparent text-purple-600 bg-purple-50 border-purple-100',
        rose: 'from-rose-500/10 to-transparent text-rose-600 bg-rose-50 border-rose-100',
    };

    return (
        <motion.div whileHover={{ y: -8, scale: 1.02 }} className="glass-morphism p-8 rounded-[2.5rem] border-white relative overflow-hidden group transition-all duration-500 shadow-xl hover:shadow-indigo-100">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorSchemes[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${colorSchemes[color].split(' ').slice(2).join(' ')}`}>
                {icon}
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-end justify-between gap-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    <div className="px-2 py-1 rounded-lg bg-emerald-50 flex items-center gap-1 shrink-0">
                        <span className="text-emerald-600 text-[10px] font-black">{trend}</span>
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
                <FiActivity size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h5 className="text-sm font-black text-slate-800 truncate tracking-tight">{title}</h5>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-0.5">{desc}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${(colors[color] || colors.indigo).split(' ')[1]}`}>{status}</span>
                <span className="text-[10px] font-bold text-slate-300">{time}</span>
            </div>
        </div>
    );
};

const RoadmapMilestone = ({ icon, label, date, status }) => {
    const statusStyles = {
        completed: 'bg-emerald-500 text-white shadow-emerald-200',
        active: 'bg-indigo-600 text-white shadow-indigo-200 animate-pulse',
        upcoming: 'bg-slate-100 text-slate-400 shadow-slate-50'
    };
    return (
        <div className="flex flex-col items-center gap-4 relative z-10">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl transition-all duration-500 ${statusStyles[status]}`}>
                {icon}
            </div>
            <div className="text-center">
                <p className="text-sm font-black text-slate-900 tracking-tight mb-1">{label}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
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

const ScheduleItem = ({ time, subject, type, color }) => {
    const colors = {
        indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
        emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
        purple: 'border-purple-500 bg-purple-50 text-purple-700',
        rose: 'border-rose-500 bg-rose-50 text-rose-700',
    };
    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border-l-[4px] ${colors[color] || colors.indigo} bg-white shadow-sm`}>
            <div className="min-w-[60px]">
                <span className="text-xs font-black text-slate-900 block">{time}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</span>
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug">{subject}</h4>
            </div>
        </div>
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
