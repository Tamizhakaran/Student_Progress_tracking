import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiInfo, FiDownload, FiPrinter, FiHash } from 'react-icons/fi';
import { LuAlertTriangle } from 'react-icons/lu';
import { MdCurrencyRupee } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const StudentFees = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [printingFee, setPrintingFee] = useState(null);

    useEffect(() => {
        fetchMyFees();
    }, []);

    const fetchMyFees = async () => {
        try {
            const { data } = await api.get('/fees/myfees');
            setFees(data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load your fee records');
            setLoading(false);
        }
    };

    const handleDownloadReceipt = (fee) => {
        setPrintingFee(fee);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const totalDue = fees.reduce((acc, f) => acc + (f.status !== 'Paid' ? (f.totalAmount - f.paidAmount) : 0), 0);
    const cumulativePaid = fees.reduce((acc, f) => acc + f.paidAmount, 0);

    return (
        <>
            <div className="space-y-12 pb-20 min-h-screen no-print">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                                Fee <span className="text-indigo-400">Portal</span>
                            </h1>
                            <p className="text-slate-400 font-bold text-lg max-w-md">
                                Monitor your academic financial status and payment deadlines.
                            </p>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md text-center md:text-right min-w-[280px]">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Net Outstanding</p>
                            <h2 className="text-5xl font-black tracking-tighter">₹{totalDue.toLocaleString()}</h2>
                            <div className="mt-4 flex items-center justify-center md:justify-end gap-2 text-xs font-bold text-slate-400">
                                <div className={`w-2 h-2 rounded-full ${totalDue > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                {totalDue > 0 ? 'Payment Required' : 'All Clear'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FiCreditCard className="text-indigo-600" /> Payment History
                        </h3>

                        <div className="grid grid-cols-1 gap-6">
                            {fees.length > 0 ? fees.map((fee, index) => (
                                <motion.div
                                    key={fee._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="premium-glass p-8 rounded-[2.5rem] border-white group hover:shadow-2xl transition-all duration-500"
                                >
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex items-start gap-6">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner border ${fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                fee.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {fee.category === 'Tuition' ? <FiCheckCircle /> : <MdCurrencyRupee />}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{fee.category} Fee</h4>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>{fee.academicYear}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="flex items-center gap-1"><FiCalendar /> Due: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col md:items-end justify-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900">₹{fee.totalAmount.toLocaleString()}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Paid: ₹{fee.paidAmount.toLocaleString()}</p>
                                                <StatusBadge status={fee.status} />
                                            </div>
                                            {fee.status === 'Paid' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDownloadReceipt(fee)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                                                >
                                                    <FiDownload /> Download Receipt
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="p-20 text-center glass-morphism rounded-[3rem] border-dashed border-2 border-slate-200">
                                    <FiInfo className="mx-auto text-4xl text-slate-300 mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No fee records found for your account</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FiInfo className="text-indigo-600" /> Instructions
                        </h3>
                        <div className="premium-glass p-8 rounded-[2.5rem] border-white space-y-6">
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black">1</div>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">Download your fee challan from the digital vault.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black">2</div>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">Payments can be made via Internet Banking or at the University Cashier.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black">3</div>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">Keep your transaction ID safe for future reference and verification.</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                                <LuAlertTriangle className="text-amber-600 shrink-0 mt-1" />
                                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                    Late payments may attract a fine as per university regulations. Please ensure payments are made before the due date.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Receipt for Printing - MOVED OUTSIDE no-print */}
            {printingFee && <ReceiptPrintout fee={printingFee} user={user} />}
        </>
    );
};

const ReceiptPrintout = ({ fee, user }) => {
    return (
        <div className="print-only p-16 bg-white text-slate-900 font-sans">
            <div className="max-w-3xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 border-b-2 border-slate-900 pb-8">
                    <h1 className="text-4xl font-bold tracking-widest uppercase text-slate-900">Fee Receipt</h1>
                    <p className="text-sm font-bold opacity-60">Receipt ID: RCPT-{fee._id.substring(0, 10).toUpperCase()}</p>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold opacity-40 uppercase text-[10px]">Student Name</p>
                            <p className="text-lg font-bold uppercase">{user?.name}</p>
                        </div>
                        <div>
                            <p className="font-bold opacity-40 uppercase text-[10px]">Department</p>
                            <p className="text-lg font-bold uppercase">{user?.department}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold opacity-40 uppercase text-[10px]">Register Number</p>
                            <p className="text-lg font-bold tracking-tight">{user?.registerNumber}</p>
                        </div>
                        <div>
                            <p className="font-bold opacity-40 uppercase text-[10px]">Academic Year</p>
                            <p className="text-lg font-bold">{fee.academicYear}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="border-2 border-slate-900 overflow-hidden rounded-lg">
                    <div className="grid grid-cols-3 bg-slate-50 p-4 border-b-2 border-slate-900 font-bold uppercase text-[10px] tracking-widest">
                        <div>Description</div>
                        <div className="text-center">Date</div>
                        <div className="text-right">Amount</div>
                    </div>
                    <div className="grid grid-cols-3 p-6 text-lg items-center divide-x-2 divide-slate-100">
                        <div className="font-bold">{fee.category} Fee</div>
                        <div className="text-center opacity-60 font-medium">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-right font-black text-2xl">₹{fee.paidAmount.toLocaleString()}</div>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex justify-end p-4">
                    <div className="flex flex-col items-end pt-4 border-t-4 border-slate-900 w-full max-w-[240px]">
                        <p className="font-bold opacity-40 uppercase text-[10px] mb-1">Total Paid</p>
                        <span className="text-4xl font-black">₹{fee.paidAmount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-24 flex justify-between items-end italic text-[10px] opacity-40 font-bold uppercase tracking-widest">
                    <p>Computer Generated Record</p>
                    <div className="text-center space-y-2">
                        <div className="w-32 h-[1px] bg-slate-900"></div>
                        <p>University Registrar Office</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        Pending: 'bg-amber-50 text-amber-600 border-amber-100',
        Overdue: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
            {status}
        </span>
    );
};

export default StudentFees;
