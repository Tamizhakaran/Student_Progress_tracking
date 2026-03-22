import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    
    // Normalize role string to Title Case (e.g. 'Admin' or 'Student')
    const normalizeRole = (role) => {
        if (!role) return 'Student';
        const r = role.toLowerCase().trim();
        return r === 'admin' ? 'Admin' : 'Student';
    };

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/me');
                    const normalizedRole = normalizeRole(data.role);
                    const userData = { ...data, role: normalizedRole };
                    
                    console.log("Session User Data (Normalized):", userData);
                    setUser(userData);
                    setIsMaintenanceMode(data.isMaintenanceMode);
                    localStorage.setItem('role', normalizedRole);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                }
            }
            setLoading(false);
        };

        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            console.log("Calling API..."); // debug

            // Consistent with: axios.post(`${API_URL}/api/login`, { email, password })
            const res = await api.post("/login", {
                email,
                password
            });
            console.log("Login Full Response Data:", JSON.stringify(res.data, null, 2));

            const normalizedRole = normalizeRole(res.data.role);
            const userData = { ...res.data, role: normalizedRole };

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", normalizedRole);
            setUser(userData);
            setIsMaintenanceMode(res.data.isMaintenanceMode);
            console.log("User set after login (Normalized):", userData);
            console.log("Role set after login:", res.data.role);
            
            toast.success(`Welcome back, ${res.data.name || 'User'}!`);
            return userData;
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Login failed");
            return null;
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/register', userData);
            if (res.data && res.data.token) {
                const normalizedRole = normalizeRole(res.data.role);
                const newUser = { ...res.data, role: normalizedRole };
                
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("role", normalizedRole);
                setUser(newUser);
                console.log("User set after register (Normalized):", newUser);
                toast.success('Registration successful!');
                return newUser;
            }
            toast.success('Registration successful! Please log in.');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return null;
        }
    };

    const toggleMaintenanceMode = async (status) => {
        try {
            const { data } = await api.put('/system/maintenance', { isMaintenanceMode: status });
            setIsMaintenanceMode(data.isMaintenanceMode);
            toast.warning(`Maintenance Mode: ${data.isMaintenanceMode ? 'ENABLED' : 'DISABLED'}`);
            return true;
        } catch (error) {
            toast.error('Failed to update maintenance mode');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        toast.info('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isMaintenanceMode, toggleMaintenanceMode }}>
            {children}
        </AuthContext.Provider>
    );
};
