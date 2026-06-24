import api from './api';

const customerAccountService = {
  getProfile: () => api.get('/customer/account/profile'),
  updateProfile: (formData) => api.put('/customer/account/profile', formData),
  changePassword: (data) => api.put('/customer/account/password', data),
  changePhone: (data) => api.put('/customer/account/phone', data),
};

export default customerAccountService;
