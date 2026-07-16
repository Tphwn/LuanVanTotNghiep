import axiosInstance from '../api/axiosInstance';

const authService = {
  register: (data) => axiosInstance.post('/auth/register', data),
  verifyRegisterOtp: (data) => axiosInstance.post('/auth/verify-register-otp', data),
  resendOtp: (data) => axiosInstance.post('/auth/resend-otp', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  loginWithGoogle: (idToken) => axiosInstance.post('/auth/google', { id_token: idToken }),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  verifyResetOtp: (data) => axiosInstance.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
  getMe: () => axiosInstance.get('/auth/me'),
};

export default authService;
