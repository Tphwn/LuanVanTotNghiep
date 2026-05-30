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
    if (error.response?.status === 401) {
      localStorage.clear();         
      window.location.href = '/login'; 
    }
    return Promise.reject(error); 
  }
);

export default axiosInstance;