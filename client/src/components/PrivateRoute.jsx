import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ roles }) => {
    const { user, loading, isMaintenanceMode } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Normalize role for internal comparison
    const normalizedRole = user.role?.toLowerCase();
    console.log("PrivateRoute Access Check - Role:", normalizedRole, "Maintenance:", isMaintenanceMode);

    // Redirect students to maintenance page if active
    if (isMaintenanceMode && normalizedRole !== 'admin') {
        console.log("Redirecting student to maintenance");
        return <Navigate to="/maintenance" replace />;
    }

    if (roles) {
        const normalizedRequiredRoles = roles.map(r => r.toLowerCase());
        if (!normalizedRequiredRoles.includes(normalizedRole)) {
            console.warn("Unauthorized access to route - Required:", normalizedRequiredRoles, "User:", normalizedRole);
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default PrivateRoute;
