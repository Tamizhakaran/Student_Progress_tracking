import axios from 'axios';

console.log("API URL:", process.env.REACT_APP_API_URL);

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL + "/api",
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