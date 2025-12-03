import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API,
});

// Add request interceptor to include token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 403 (locked account)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // Account locked or forbidden - logout user
      const message = error.response.data?.message || '';
      if (message.includes('khóa') || message.includes('locked') || message.includes('Locked')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Store the locked message for the login page to display
        sessionStorage.setItem('lockedAccountMessage', message);
        window.location.href = '/login?locked=true';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
