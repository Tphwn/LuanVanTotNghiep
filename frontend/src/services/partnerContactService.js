import api from './api';

const partnerContactService = {
  submitRequest: (payload) => api.post('/public/partner-contact', payload),
};

export default partnerContactService;
