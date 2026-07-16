import api from './api';

const publicPromotionService = {
  getSystemPromotions: () => api.get('/public/promotions/system'),
  getHotelPromotions: (hotelId) => api.get(`/public/promotions/hotel/${hotelId}`),
};

export default publicPromotionService;
