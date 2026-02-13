import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = "" }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative flex items-center justify-between w-14 h-7 rounded-full p-1 transition-colors duration-500 shadow-inner overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                } ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute inset-0 transition-opacity duration-500 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/10" />
                </div>
            </div>

            <motion.div
                layout
                initial={false}
                animate={{ x: theme === 'dark' ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-white rounded-full shadow-lg z-10 flex items-center justify-center overflow-hidden"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div
                        animate={{ y: theme === 'dark' ? 20 : 0 }}
                        className="absolute text-amber-500"
                    >
                        <FiSun size={12} />
                    </motion.div>
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: theme === 'dark' ? 0 : -20 }}
                        className="absolute text-indigo-600"
                    >
                        <FiMoon size={12} />
                    </motion.div>
                </div>
            </motion.div>

            <div className="flex justify-around w-full relative z-0">
                <FiSun size={10} className={`transition-opacity duration-300 ${theme === 'dark' ? 'opacity-20' : 'opacity-100 text-amber-500'}`} />
                <FiMoon size={10} className={`transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100 text-indigo-400' : 'opacity-20'}`} />
            </div>
        </button>
    );
};

export default ThemeToggle;
