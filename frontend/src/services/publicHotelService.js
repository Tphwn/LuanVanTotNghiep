import api from './api';

const publicHotelService = {
  getLocations: () => api.get('/public/locations'),
  getPopularDestinations: () => api.get('/public/destinations/popular'),
  searchHotels: (params) => api.get('/public/hotels/search', { params }),
  searchRooms: (params) => api.get('/public/hotels/search', { params }),
  getHotelById: (id, params) => api.get(`/public/hotels/${id}`, { params }),
  getRoomById: (hotelId, roomId, params) => api.get(`/public/hotels/${hotelId}/rooms/${roomId}`, { params }),
};

export default publicHotelService;
