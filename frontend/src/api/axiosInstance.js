import axios from 'axios';
import { getToken } from '../utils/storage';
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', 
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken(); 
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config; 
});
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/google');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      if (path !== '/' && !path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;