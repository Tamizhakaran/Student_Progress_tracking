import axios from 'axios';

// Get API URL from env
const API_URL = process.env.REACT_APP_API_URL;

// ✅ Ensure no trailing slash
const cleanURL = API_URL ? API_URL.replace(/\/$/, "") : "";

// ✅ Final base URL
const baseURL = cleanURL ? `${cleanURL}/api` : "/api";

console.log("Final Base URL:", baseURL);

const api = axios.create({
    baseURL,
});

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
            console.log("Unauthorized access");
        }
        return Promise.reject(error);
    }
);

export default api;