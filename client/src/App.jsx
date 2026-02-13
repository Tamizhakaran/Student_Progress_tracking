import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
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


function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />

                    <Route element={<PrivateRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/students" element={<StudentManagement />} />
                            <Route path="/attendance" element={<AttendanceManagement />} />
                            <Route path="/study-materials" element={<StudyMaterials />} />
                            <Route path="/schedule" element={<ScheduleManagement />} />
                            <Route path="/performance" element={<Performance />} />
                            <Route path="/performance-management" element={<PerformanceManagement />} />
                            <Route path="/assignments" element={<Assignments />} />
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
