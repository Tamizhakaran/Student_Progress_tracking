import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/me');
                    setUser(data);
                    setIsMaintenanceMode(data.isMaintenanceMode);
                    localStorage.setItem('role', data.role);
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

            console.log("Response:", res.data);

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            setUser(res.data);
            setIsMaintenanceMode(res.data.isMaintenanceMode);
            
            toast.success(`Welcome back, ${res.data.name || 'User'}!`);
            return res.data;
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
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("role", res.data.role);
                setUser(res.data);
                toast.success('Registration successful!');
                return res.data;
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
