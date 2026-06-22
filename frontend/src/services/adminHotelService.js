import api from './api';

const adminHotelService = {
  getById: (id) => api.get(`/admin/hotels/${id}`),

  getHotels: () => api.get('/admin/hotels'),

  approve: (id) => api.patch(`/admin/hotels/${id}/approve`),

  reject: (id, lyDo) => api.patch(`/admin/hotels/${id}/reject`, { lyDo }),

  requestInfo: (id, ghiChu) => api.patch(`/admin/hotels/${id}/request-info`, { ghiChu }),

  lock: (id) => api.patch(`/admin/hotels/${id}/lock`),

  unlock: (id) => api.patch(`/admin/hotels/${id}/unlock`),
};

export default adminHotelService;
