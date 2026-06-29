import api from './api';

const adminPartnerRequestService = {
  getStats: () => api.get('/admin/partner-requests/stats'),
  getList: (params) => api.get('/admin/partner-requests', { params }),
  getById: (id) => api.get(`/admin/partner-requests/${id}`),
  updateStatus: (id, payload) => api.patch(`/admin/partner-requests/${id}/status`, payload),
};

export default adminPartnerRequestService;
