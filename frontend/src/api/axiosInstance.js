import axios from 'axios';
import { getToken } from '../utils/storage';
import { getLoginRouteFromPath } from '../utils/authPortal';

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
      || url.includes('/auth/google')
      || url.includes('/auth/forgot-password')
      || url.includes('/auth/verify-reset-otp')
      || url.includes('/auth/reset-password')
      || url.includes('/auth/resend-otp');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      const isAuthPage = path.startsWith('/login')
        || path.startsWith('/register')
        || path.startsWith('/forgot-password')
        || path === '/partner/login'
        || path === '/partner/forgot-password'
        || path === '/admin/login'
        || path === '/admin/forgot-password';
      if (path !== '/' && !isAuthPage) {
        window.location.href = getLoginRouteFromPath(path);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;