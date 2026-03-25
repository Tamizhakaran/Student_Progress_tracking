import axios from 'axios';

// Get API URL from env - Vite uses import.meta.env
const API_URL = import.meta.env.VITE_API_URL || "https://student-progress-tracking.onrender.com";

// ✅ Ensure no trailing slash
const cleanURL = API_URL ? API_URL.replace(/\/$/, "") : "";

// ✅ Final base URL for API calls
const baseURL = cleanURL ? `${cleanURL}/api` : "/api";

console.log("Final Base URL:", baseURL);

const api = axios.create({
    baseURL,
});

// Helper to get full URL for uploaded files
export const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // Ensure path starts with / if it doesn't already
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Combine with cleanURL
    return `${cleanURL}${normalizedPath}`;
};

// 🔐 Add token interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔁 Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const message = error.response.data?.message || "Unauthorized access";
            console.error("401 Unauthorized:", message);
        }
        return Promise.reject(error);
    }
);

export default api;