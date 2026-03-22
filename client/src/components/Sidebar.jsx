import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiBook, FiCalendar, FiActivity, FiLayers,
    FiClipboard, FiPieChart, FiSettings, FiLogOut, FiAward, FiClock, FiBriefcase
} from 'react-icons/fi';
import { LuGraduationCap, LuAlertTriangle } from 'react-icons/lu';
import { MdCurrencyRupee } from 'react-icons/md';
import clsx from 'clsx';
import { motion } from 'framer-motion';



const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout, isMaintenanceMode, toggleMaintenanceMode } = useAuth();
    const location = useLocation();

    const roleMenus = {
        'Admin': [
            { name: 'Home', icon: FiHome, path: '/adminpage' },
            { name: 'Students', icon: LuGraduationCap, path: '/students' },
            { name: 'Attendance', icon: FiCalendar, path: '/attendance' },
            { name: 'Performance', icon: FiActivity, path: '/performance-management' },
            { name: 'Achievements', icon: FiAward, path: '/achievement-management' },
            { name: 'Leaves', icon: FiClipboard, path: '/leave-management' },
            { name: 'Fees', icon: MdCurrencyRupee, path: '/fee-management' },
            { name: 'Placements', icon: FiBriefcase, path: '/placement-management' },
            { name: 'Subjects', icon: FiBook, path: '/subject-management' },
            { name: 'Schedule', icon: FiClock, path: '/schedule' },
            { name: 'Study Materials', icon: FiLayers, path: '/study-materials' },
        ],
        'Student': [
            { name: 'Home', icon: FiHome, path: '/studentpage' },
            { name: 'Performance', icon: FiActivity, path: '/performance' },
            { name: 'Attendance', icon: FiCalendar, path: '/attendance' },
            { name: 'Achievements', icon: FiAward, path: '/achievements' },
            { name: 'Fees', icon: MdCurrencyRupee, path: '/my-fees' },
            { name: 'Leaves', icon: FiClipboard, path: '/leaves' },
            { name: 'Study Materials', icon: FiBook, path: '/study-materials' },
        ],
    };

    const role = user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'Student';
    console.log("Sidebar Detected Role:", role);
    const menus = roleMenus[role];

    return (
        <motion.div
            initial={false}
            animate={{
                width: isOpen ? (window.innerWidth < 768 ? '100%' : '260px') : (window.innerWidth < 768 ? '0px' : '64px')
            }}
            className={clsx(
                "glass-morphism h-screen flex flex-col z-30 transition-all duration-300 fixed md:relative border-r border-slate-200/50 shadow-2xl shadow-slate-900/5 no-print",
                !isOpen && "md:w-[64px]"
            )}
            style={{ overflow: 'visible' }}
        >
            {/* Logo space removed */}



            <nav className={clsx("flex-1 py-4", isOpen ? "px-2" : "px-0")} style={{ overflow: 'visible' }}>
                <ul className="flex flex-col items-center space-y-4">
                    {menus.map((menu, index) => {
                        const Icon = menu.icon;
                        const isActive = location.pathname === menu.path;

                        return (
                            <motion.li
                                key={menu.name}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.05 * index }}
                                className="w-full flex justify-center"
                            >
                                <Link
                                    to={menu.path}
                                    className={clsx(
                                        "flex flex-col items-center justify-center transition-all duration-500 group relative",
                                        isActive
                                            ? "w-11 h-11 bg-slate-950 text-white rounded-xl shadow-xl shadow-slate-900/40"
                                            : "w-10 h-10 text-slate-400 hover:text-indigo-600"
                                    )}
                                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                                >
                                    <Icon className={clsx("text-lg transition-all duration-300", isActive ? "scale-110" : "opacity-60 group-hover:opacity-100 group-hover:scale-125")} />

                                    {!isOpen && (
                                        <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] whitespace-nowrap">
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                                <Icon className="text-xl" />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight">{menu.name}</span>
                                            {/* Tooltip Arrow */}
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[8px] border-transparent border-r-indigo-600" />
                                        </div>
                                    )}

                                    {isActive && (
                                        <motion.div
                                            layoutId="activeGlow"
                                            className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full -z-10"
                                        />
                                    )}
                                </Link>
                            </motion.li>
                        );
                    })}
                </ul>
            </nav>

            <div className="py-6 flex flex-col items-center justify-center border-t border-slate-100 gap-4 overflow-visible">
                <button
                    onClick={logout}
                    className={clsx(
                        "flex items-center justify-center w-10 h-10 rounded-full font-black transition-all group overflow-visible relative",
                        "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-110 active:scale-95"
                    )}
                >
                    <FiLogOut className="text-lg relative z-10 transition-transform duration-300" />

                    {!isOpen && (
                        <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-2xl bg-rose-600 text-white flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(225,29,72,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] whitespace-nowrap">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                <FiLogOut className="text-xl" />
                            </div>
                            <span className="text-sm font-bold tracking-tight">Logout</span>
                            {/* Tooltip Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[8px] border-transparent border-r-rose-600" />
                        </div>
                    )}
                </button>

                {user?.role === 'Admin' && (
                    <button
                        onClick={() => toggleMaintenanceMode(!isMaintenanceMode)}
                        className={clsx(
                            "flex items-center justify-center transition-all duration-300 group relative overflow-visible shrink-0 outline-none",
                            "w-10 h-10 rounded-xl shadow-md border animate-none",
                            isMaintenanceMode
                                ? "bg-amber-500 text-white shadow-amber-500/30 border-amber-400 rotate-3 scale-110"
                                : "bg-white text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 hover:shadow-lg"
                        )}
                    >
                        <LuAlertTriangle className={clsx("text-lg transition-transform group-hover:scale-110", isMaintenanceMode && "animate-pulse")} />

                        {!isOpen && (
                            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-2xl bg-amber-600 text-white flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(217,119,6,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] whitespace-nowrap">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <LuAlertTriangle className="text-xl" />
                                </div>
                                <span className="text-sm font-bold tracking-tight">
                                    {isMaintenanceMode ? "Maintenance: ON" : "Maintenance: OFF"}
                                </span>
                                {/* Tooltip Arrow */}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[8px] border-transparent border-r-amber-600" />
                            </div>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default Sidebar;
