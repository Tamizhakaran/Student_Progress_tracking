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
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                    setIsMaintenanceMode(data.isMaintenanceMode);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            setIsMaintenanceMode(data.isMaintenanceMode);
            toast.success(`Welcome back, ${data.name}!`);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/auth/register', userData);
            toast.success('Registration successful! Please log in.');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return false;
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
        setUser(null);
        toast.info('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isMaintenanceMode, toggleMaintenanceMode }}>
            {children}
        </AuthContext.Provider>
    );
};
