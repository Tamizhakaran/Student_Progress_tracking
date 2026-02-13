import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiBook, FiCalendar, FiActivity,
    FiClipboard, FiPieChart, FiSettings, FiLogOut, FiAward, FiClock
} from 'react-icons/fi';
import { LuGraduationCap, LuAlertTriangle } from 'react-icons/lu';
import clsx from 'clsx';
import { motion } from 'framer-motion';



const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout, isMaintenanceMode, toggleMaintenanceMode } = useAuth();
    const location = useLocation();

    const roleMenus = {
        'Admin': [
            { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
            { name: 'Students', icon: LuGraduationCap, path: '/students' },
            { name: 'Attendance', icon: FiCalendar, path: '/attendance' },
            { name: 'Schedule', icon: FiClock, path: '/schedule' },
            { name: 'Performance', icon: FiActivity, path: '/performance-management' },
            { name: 'Study Materials', icon: FiBook, path: '/study-materials' },
        ],
        'Student': [
            { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
            { name: 'My Performance', icon: FiActivity, path: '/performance' },
            { name: 'Attendance', icon: FiCalendar, path: '/attendance' },
            { name: 'Study Materials', icon: FiBook, path: '/study-materials' },
        ],
    };

    const menus = roleMenus[user?.role] || roleMenus['Student'];

    return (
        <motion.div
            initial={false}
            animate={{
                width: isOpen ? (window.innerWidth < 768 ? '100%' : '260px') : (window.innerWidth < 768 ? '0px' : '80px')
            }}
            className={clsx(
                "glass-morphism h-screen flex flex-col z-30 transition-all duration-300 fixed md:relative border-r border-slate-200/50 shadow-2xl shadow-slate-900/5",
                !isOpen && "md:w-[80px]"
            )}
        >
            <div className="h-32 flex items-center justify-center px-4 border-b border-slate-100">
                <Link to="/dashboard" className={clsx(
                    "flex items-center gap-3 group transition-all duration-300",
                    isOpen ? "flex-col text-center" : "flex-row"
                )}>
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all shrink-0">
                        <LuGraduationCap className="text-2xl" />
                    </div>
                    {isOpen && (
                        <h1 className="text-2xl font-black text-slate-950 tracking-tighter leading-none mt-1">
                            StudentIQ
                        </h1>
                    )}
                </Link>
            </div>

            <div className="px-6 py-6 border-b border-slate-100">
                <div className={clsx(
                    "p-3 rounded-2xl bg-slate-100/50 border border-slate-200/50 flex items-center gap-3 overflow-hidden",
                    !isOpen && "justify-center px-0 bg-transparent border-transparent shadow-none"
                )}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    {isOpen && (
                        <div className="overflow-hidden">
                            <h4 className="font-black text-slate-800 truncate text-xs">{user?.name}</h4>
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">
                                {user?.role === 'Admin' ? 'System Administrator' : 'BIT Student'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="flex flex-col items-center space-y-6">
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
                                            ? "w-14 h-14 bg-slate-950 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/40 scale-105"
                                            : "w-10 h-10 text-slate-400 hover:text-indigo-600"
                                    )}
                                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                                >
                                    <Icon className={clsx("text-lg transition-all duration-300", isActive ? "scale-110" : "opacity-60 group-hover:opacity-100 group-hover:scale-125")} />

                                    {isOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={clsx(
                                                "absolute left-full ml-4 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 z-50",
                                                !isOpen && "hidden"
                                            )}
                                        >
                                            {menu.name}
                                        </motion.span>
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

            <div className="py-8 flex flex-col items-center justify-center border-t border-slate-100 gap-6">
                <button
                    onClick={logout}
                    className={clsx(
                        "flex items-center justify-center w-12 h-12 rounded-full font-black transition-all group overflow-hidden relative",
                        "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-110 active:scale-95"
                    )}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <FiLogOut className="text-xl relative z-10 transition-transform duration-300" />
                </button>

                {user?.role === 'Admin' && (
                    <button
                        onClick={() => toggleMaintenanceMode(!isMaintenanceMode)}
                        className={clsx(
                            "flex items-center justify-center transition-all duration-300 group relative overflow-hidden shrink-0",
                            "w-11 h-11 rounded-2xl shadow-md",
                            isMaintenanceMode
                                ? "bg-amber-500 text-white shadow-amber-500/30 rotate-3 scale-110"
                                : "bg-white text-slate-400 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 hover:shadow-lg"
                        )}
                        title={isMaintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                    >
                        <LuAlertTriangle className={clsx("text-xl transition-transform group-hover:scale-110", isMaintenanceMode && "animate-pulse")} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default Sidebar;
