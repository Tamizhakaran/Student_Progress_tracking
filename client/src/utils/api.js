import axios from 'axios';

const vApi = import.meta.env.VITE_API_URL;
const baseURL = (vApi && vApi !== "undefined") ? vApi + "/api" : "/api";
console.log("Final Base URL:", baseURL);

const api = axios.create({
    baseURL,
});

// Add token interceptor
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

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // handle unauthorized
        }
        return Promise.reject(error);
    }
);

export default api;