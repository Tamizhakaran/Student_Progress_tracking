import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiActivity, FiCalendar } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../utils/api';

const Performance = () => {
    const [studentCgpa, setStudentCgpa] = useState(0);
    const [studentAttendance, setStudentAttendance] = useState(0);
    const [studentRank, setStudentRank] = useState(0);
    const [subjectData, setSubjectData] = useState([]);
    const [userSemester, setUserSemester] = useState('1');

    useEffect(() => {
        fetchPerformanceData();
        fetchSubjectMarks();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            // Fetch user profile
            const userResponse = await api.get('/auth/me');
            const userData = userResponse.data;
            setStudentCgpa(userData.cgpa || 0);
            setUserSemester(userData.semester || '1');

            // Fetch attendance
            const { data } = await api.get('/attendance/my-attendance');
            const records = data.data;
            const total = records.length;
            const present = records.filter(r => ['Present', 'Late'].includes(r.status)).length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            setStudentAttendance(percentage);

            // Fetch rank
            const rankRes = await api.get('/students/rank');
            setStudentRank(rankRes.data.rank);

            return userData;
        } catch (error) {
            console.error('Failed to fetch performance data');
            return null;
        }
    };

    const fetchSubjectMarks = async () => {
        try {
            const { data } = await api.get('/marks/my-marks');
            if (data.data && data.data.length > 0) {
                const allMarks = data.data;
                // Find the latest semester available in the database
                const latestSem = Math.max(...allMarks.map(m => Number(m.semester)));

                const filtered = allMarks.filter(m => m.semester.toString() === latestSem.toString());
                const formatted = filtered.map(m => ({
                    subject: m.subject,
                    score: m.score
                }));
                setSubjectData(formatted);
            } else {
                setSubjectData([]);
            }
        } catch (error) {
            console.error('Failed to fetch subject marks');
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
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Performance</h1>
                <p className="text-slate-500 font-bold mt-1">Track your academic progress and achievements.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FiAward className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current CGPA</p>
                            <h3 className="text-3xl font-black text-slate-900">{studentCgpa ? studentCgpa.toFixed(2) : '0.00'}</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FiCalendar className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                            <h3 className="text-3xl font-black text-slate-900">{studentAttendance}%</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FiActivity className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</p>
                            <h3 className="text-3xl font-black text-slate-900">#{studentRank || '--'}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Semester Progress */}
                <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl">
                    <h3 className="text-2xl font-black text-slate-900 mb-6">Semester Progress</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={semesterData}>
                                <defs>
                                    <linearGradient id="cgpaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="cgpa" stroke="#6366f1" strokeWidth={3} fill="url(#cgpaGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subject Performance */}
                <div className="glass-morphism p-8 rounded-[2.5rem] border-white shadow-xl">
                    <h3 className="text-2xl font-black text-slate-900 mb-6">Subject Performance</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} angle={-30} textAnchor="end" height={80} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#6366f1" radius={[12, 12, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Performance;
