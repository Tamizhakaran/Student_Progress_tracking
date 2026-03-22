import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    // Close on click outside if needed (though backdrop handles it for modal)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Mobile & Desktop */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 md:px-6 z-20 no-print sticky top-0">
                    <button
                        className="md:hidden p-2 text-slate-600 text-2xl hover:bg-slate-100 rounded-xl transition-all"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <FiMenu />
                    </button>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto relative" ref={dropdownRef}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setProfileOpen(true)}
                            className="flex items-center gap-2 md:gap-4 bg-slate-50 hover:bg-slate-100 p-1 md:p-1.5 md:pr-4 rounded-xl md:rounded-2xl transition-all border border-slate-100 group"
                        >
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-200 group-hover:rotate-3 transition-transform overflow-hidden text-xs md:text-base">
                                {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                                    <img
                                        src={user.profileImage}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-[10px] md:text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{user?.name}</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </motion.button>

                        <AnimatePresence>
                            {profileOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setProfileOpen(false)}
                                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="relative w-full max-w-md bg-white rounded-[1.5rem] shadow-2xl overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">User Profile</h3>
                                            <button
                                                onClick={() => setProfileOpen(false)}
                                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <FiX size={24} />
                                            </button>
                                        </div>

                                        <div className="p-8 flex flex-col items-center">
                                            <div className="relative mb-8">
                                                <div className="w-48 h-48 rounded-full border-[6px] border-indigo-50/50 p-2 overflow-hidden bg-indigo-50 shadow-inner flex items-center justify-center">
                                                    {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-6xl font-black text-indigo-400 uppercase">
                                                            {user?.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full space-y-4 mb-10">
                                                {user?.role !== 'Admin' && (
                                                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                                        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.1em]">Roll Number</span>
                                                        <span className="text-sm font-bold text-slate-900 uppercase">
                                                            {user?.registerNumber || user?.rollNumber || '7376231ME151'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.1em]">Name</span>
                                                    <span className="text-sm font-bold text-slate-900 uppercase">
                                                        {user?.name}
                                                    </span>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setProfileOpen(false)}
                                                className="w-full py-4 bg-[#8b5cf6] text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-indigo-100/50 hover:bg-[#7c3aed]"
                                            >
                                                Close
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8">
                    <div className="container mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default Layout;
