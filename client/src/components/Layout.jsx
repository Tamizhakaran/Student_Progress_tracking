import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { getMediaURL } from '../utils/mediaUtils';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Mobile & Desktop */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 md:px-6 z-20 no-print sticky top-0">
                    {isMobile && (
                        <button
                            className="p-2 text-slate-600 text-2xl hover:bg-slate-100 rounded-xl transition-all"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <FiMenu />
                        </button>
                    )}

                    <div className="flex items-center gap-2 md:gap-4 ml-auto relative" ref={dropdownRef}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setProfileOpen(true)}
                            className="flex items-center gap-2 md:gap-4 bg-slate-50 hover:bg-slate-100 p-1 md:p-1.5 md:pr-4 rounded-xl md:rounded-2xl transition-all border border-slate-100 group"
                        >
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-200 group-hover:rotate-3 transition-transform overflow-hidden text-xs md:text-base">
                                {user?.profileImage && user.profileImage !== 'no-photo.jpg' && getMediaURL(user.profileImage) ? (
                                    <img
                                        src={getMediaURL(user.profileImage)}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.parentElement.innerHTML = `<span class="text-white font-black text-sm">${user?.name?.charAt(0) || '?'}</span>`;
                                        }}
                                    />
                                ) : (
                                    <span className="text-white font-black text-sm">{user?.name?.charAt(0)}</span>
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
                                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-visible"
                                        >
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] border-[8px] border-white p-1 overflow-hidden bg-white shadow-2xl flex items-center justify-center relative transition-transform hover:scale-105">
                                                    {user?.profileImage && user.profileImage !== 'no-photo.jpg' && getMediaURL(user.profileImage) ? (
                                                        <img
                                                            src={getMediaURL(user.profileImage)}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover rounded-[2rem]"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.parentElement.innerHTML = `<span class="text-indigo-600 font-black text-6xl">${user?.name?.charAt(0) || '?'}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-black text-indigo-400 uppercase">
                                                            {user?.name?.charAt(0) || '?'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-indigo-400/30 blur-3xl rounded-full scale-110 -z-10"></div>
                                            </div>

                                            <div className="p-8 pt-20 md:pt-24 flex flex-col items-center text-center overflow-y-auto max-h-[80vh] custom-scrollbar">
                                                <div className="mb-6">
                                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1 uppercase">
                                                        {user?.name || 'User'}
                                                    </h3>
                                                    <div className="inline-flex px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                                                        {user?.role || 'Member'}
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-50/80 rounded-[2.5rem] p-6 space-y-5 mb-8 border border-slate-100/50">
                                                    {user?.registerNumber && (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Registration ID</span>
                                                            <span className="text-sm font-bold text-slate-700">{user.registerNumber}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Email Address</span>
                                                        <span className="text-xs md:text-sm font-bold text-slate-800 break-all">{user?.email}</span>
                                                    </div>
                                                    {user?.department && (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Department</span>
                                                            <span className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-tight leading-tight">{user.department}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02, translateY: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setProfileOpen(false)}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 hover:bg-slate-800 shrink-0"
                                                >
                                                    Dismiss
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
                {sidebarOpen && isMobile && (
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
