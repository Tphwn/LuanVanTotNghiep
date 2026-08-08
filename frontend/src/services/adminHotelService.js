import api from './api';

const adminHotelService = {
  getById: (id) => api.get(`/admin/hotels/${id}`),

  getHotels: () => api.get('/admin/hotels'),

  approve: (id) => api.patch(`/admin/hotels/${id}/approve`),

  reject: (id, lyDo) => api.patch(`/admin/hotels/${id}/reject`, { lyDo }),

  lock: (id, lyDoKhoa) => api.patch(`/admin/hotels/${id}/lock`, { ly_do_khoa: lyDoKhoa }),

  unlock: (id) => api.patch(`/admin/hotels/${id}/unlock`),
};

export default adminHotelService;
