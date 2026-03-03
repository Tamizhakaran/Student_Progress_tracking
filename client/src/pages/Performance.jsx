import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiAward, FiActivity, FiCalendar, FiBookOpen, FiStar, FiTriangle, FiTarget, FiZap, FiCheckCircle } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import api from '../utils/api';
import { calcAttendancePercentage } from '../utils/attendanceUtils';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="premium-glass p-6 rounded-[1.5rem] shadow-2xl border-white/20 backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">
                    {payload[0].value} <span className="text-[10px] text-indigo-600 italic">SCORE</span>
                </p>
            </div>
        );
    }
    return null;
};

const Performance = () => {
    const [studentCgpa, setStudentCgpa] = useState(0);
    const [studentAttendance, setStudentAttendance] = useState(0);
    const [studentRank, setStudentRank] = useState(0);
    const [subjectData, setSubjectData] = useState([]);
    const [userSemester, setUserSemester] = useState('1');
    const [userDept, setUserDept] = useState('');
    const [curriculum, setCurriculum] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchPerformanceData(),
                fetchSubjectMarks(),
                fetchCurriculum()
            ]);
            setLoading(false);
        };
        init();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            const userResponse = await api.get('/auth/me');
            const userData = userResponse.data;
            setStudentCgpa(userData.cgpa || 0);
            setUserSemester(userData.semester || '1');
            setUserDept(userData.department || '');

            const { data } = await api.get('/attendance/my-attendance');
            const records = data.data;
            // Use two-session rule: FN+AN present = 1 day, one session = 0.5 days
            const percentage = calcAttendancePercentage(records);
            setStudentAttendance(percentage);

            const rankRes = await api.get('/students/rank');
            setStudentRank(rankRes.data.rank);
        } catch (error) {
            console.error('Performance sync failed');
        }
    };

    const fetchCurriculum = async () => {
        try {
            const userResponse = await api.get('/auth/me');
            const userData = userResponse.data;
            if (!userData.department) return;

            const { data } = await api.get(`/subjects?department=${userData.department}`);
            if (data.data) {
                const grouped = data.data.reduce((acc, sub) => {
                    const sem = sub.semester;
                    if (!acc[sem]) acc[sem] = [];
                    acc[sem].push(sub);
                    return acc;
                }, {});
                setCurriculum(grouped);
            }
        } catch (error) {
            console.error('Curriculum fetch failed');
        }
    };

    const fetchSubjectMarks = async () => {
        try {
            const { data } = await api.get('/marks/my-marks');
            if (data.data && data.data.length > 0) {
                const allMarks = data.data;
                const latestSem = Math.max(...allMarks.map(m => Number(m.semester)));
                const filtered = allMarks.filter(m => m.semester.toString() === latestSem.toString());
                const formatted = filtered.map(m => ({
                    subject: m.subject,
                    score: m.score
                }));
                setSubjectData(formatted);
            }
        } catch (error) {
            console.error('Metrics fetch failed');
        }
    };

    const semesterData = [
        { name: 'Sem 1', cgpa: 7.2 },
        { name: 'Sem 2', cgpa: 7.5 },
        { name: 'Sem 3', cgpa: 8.1 },
        { name: 'Sem 4', cgpa: 7.9 },
        { name: 'Sem 5', cgpa: studentCgpa || 8.4 },
    ];

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        My <span className="text-indigo-600">Performance</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-base max-w-2xl leading-relaxed">
                        Track your academic progress, CGPA trends, and class rank.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden group">
                    <FiAward className="text-indigo-600 text-xl ml-2 group-hover:rotate-12 transition-transform" />
                    <span className="pr-6 font-black text-slate-800 text-sm uppercase tracking-widest">
                        Cycle {userSemester} Active
                    </span>
                </div>
            </motion.div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PerformanceCard
                    icon={<FiTarget />}
                    label="Current CGPA"
                    value={studentCgpa ? studentCgpa.toFixed(2) : '0.00'}
                    sub="Overall Performance"
                    color="indigo"
                />
                <PerformanceCard
                    icon={<FiZap />}
                    label="My Rank"
                    value={`#${studentRank || '--'}`}
                    sub="Class Standing"
                    color="purple"
                />
                <PerformanceCard
                    icon={<FiCheckCircle />}
                    label="Attendance Status"
                    value={`${studentAttendance}%`}
                    sub="Attendance"
                    color="emerald"
                />
            </div>

            {/* Analytics Forge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 premium-glass p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group/graph"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] transition-all duration-700 group-hover/graph:bg-indigo-500/10"></div>
                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">CGPA Trend</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">CGPA changes over semesters</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-xl shadow-xl">
                            <FiTrendingUp />
                        </div>
                    </div>
                    <div className="h-[400px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={semesterData}>
                                <defs>
                                    <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} domain={[0, 10]} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="cgpa" stroke="#6366f1" strokeWidth={5} fill="url(#cgpaGrad)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 premium-glass p-10 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col group/bar"
                >
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]"></div>
                    <div className="mb-12 relative z-10">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Module Stats</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Latest academic cycle decomposition</p>
                    </div>
                    <div className="flex-1 min-h-[400px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData} layout="vertical" margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} width={90} />
                                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<CustomTooltip />} />
                                <Bar dataKey="score" radius={[0, 15, 15, 0]} barSize={16}>
                                    {subjectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score > 85 ? '#6366f1' : entry.score > 70 ? '#8b5cf6' : '#ec4899'} className="transition-all hover:opacity-80" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 p-6 bg-slate-950 rounded-[2.5rem] shadow-2xl group/btn relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-transparent to-indigo-600/20 translate-x-full group-hover/btn:translate-x-[-200%] transition-transform duration-1000"></div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Insight</p>
                        <p className="text-xs font-bold text-white leading-relaxed italic">
                            "{studentCgpa > 8 ? "Exceptional trajectory. Maintain current velocity to secure tier-1 standing." : "Progress identified. Optimize module decomposition to enhance cumulative metrics."}"
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Academic Curriculum */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-slate-950 text-white flex items-center justify-center text-3xl shadow-2xl">
                        <FiBookOpen />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Academic Curriculum</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Full semester decomposition for {userDept || 'your department'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                        <motion.div
                            key={sem}
                            whileHover={{ y: -5 }}
                            className={clsx(
                                "premium-glass p-8 rounded-[2.5rem] shadow-xl border transition-all duration-300",
                                Number(userSemester) === sem ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100"
                            )}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester {sem}</span>
                                {Number(userSemester) === sem && (
                                    <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black rounded-lg uppercase tracking-tighter shadow-lg shadow-indigo-200">Current</span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {curriculum[sem] && curriculum[sem].length > 0 ? (
                                    curriculum[sem].map((sub) => (
                                        <div key={sub._id} className="group relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                                                <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight leading-tight">
                                                    {sub.name}
                                                </p>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase ml-4.5 mt-0.5 tracking-widest">{sub.code || 'NO CODE'}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] italic text-slate-400 font-medium">Pending admin update...</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const PerformanceCard = ({ icon, label, value, sub, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
    };
    return (
        <motion.div
            whileHover={{ y: -12, scale: 1.02 }}
            className="premium-glass p-10 rounded-[3.5rem] shadow-2xl relative group overflow-hidden transition-all duration-500 hover:shadow-indigo-200/40"
        >
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-3xl transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 shadow-lg ${colors[color]}`}>
                    {icon}
                </div>
                <div className="w-10 h-10 premium-glass rounded-full flex items-center justify-center border border-white/50">
                    <FiTriangle className="text-[10px] text-indigo-400 rotate-180" />
                </div>
            </div>
            <div className="space-y-2 relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors duration-500">{value}</h3>
                    <span className="text-[10px] font-black text-slate-300 italic uppercase">Metric</span>
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pt-3 flex items-center gap-2">
                    <span className="w-8 h-[2px] bg-slate-100 group-hover:w-16 group-hover:bg-indigo-100 transition-all duration-700"></span>
                    {sub}
                </p>
            </div>

            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-slate-900/5 rounded-full blur-[40px] group-hover:bg-indigo-500/10 transition-all duration-700"></div>
        </motion.div>
    );
};

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default Performance;
