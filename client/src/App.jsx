import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import StudyMaterials from './pages/StudyMaterials';
import Performance from './pages/Performance';
import Assignments from './pages/Assignments';
import ScheduleManagement from './pages/ScheduleManagement';
import PerformanceManagement from './pages/PerformanceManagement';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MaintenancePage from './pages/MaintenancePage';
import FeeManagement from './pages/FeeManagement';
import StudentFees from './pages/StudentFees';
import AchievementManagement from './pages/AchievementManagement';
import Achievements from './pages/Achievements';
import Leaves from './pages/Leaves';
import LeaveManagement from './pages/LeaveManagement';
import PlacementManagement from './pages/PlacementManagement';
import SubjectManagement from './pages/SubjectManagement';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin-register" element={<AdminRegister />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />

                    <Route element={<PrivateRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/adminpage" element={<StudentManagement />} />
                            <Route path="/studentpage" element={<Dashboard />} />
                            <Route path="/students" element={<StudentManagement />} />
                            <Route path="/attendance" element={<AttendanceManagement />} />
                            <Route path="/study-materials" element={<StudyMaterials />} />
                            <Route path="/schedule" element={<ScheduleManagement />} />
                            <Route path="/performance" element={<Performance />} />
                            <Route path="/performance-management" element={<PerformanceManagement />} />
                            <Route path="/assignments" element={<Assignments />} />
                            <Route path="/achievement-management" element={<AchievementManagement />} />
                            <Route path="/achievements" element={<Achievements />} />
                            <Route path="/leave-management" element={<LeaveManagement />} />
                            <Route path="/leaves" element={<Leaves />} />
                            <Route path="/fee-management" element={<FeeManagement />} />
                            <Route path="/my-fees" element={<StudentFees />} />
                            <Route path="/placement-management" element={<PlacementManagement />} />
                            <Route path="/subject-management" element={<SubjectManagement />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <ToastContainer position="top-right" autoClose={3000} />
            </AuthProvider>
        </Router>
    );
}

export default App;
