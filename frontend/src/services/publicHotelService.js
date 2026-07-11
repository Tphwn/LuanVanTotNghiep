import api from './api';
const publicHotelService = {
  getLocations: () => api.get('/public/locations'),
  getPopularDestinations: () => api.get('/public/destinations/popular'),
  getFeaturedByDestination: () => api.get('/public/destinations/featured'),
  listHotels: (params) => api.get('/public/hotels', { params }),
  searchHotels: (params) => api.get('/public/hotels/search', { params }),
  searchRooms: (params) => api.get('/public/hotels/search', { params }),
  getAmenityFilters: () => api.get('/public/amenities'),
  getHotelById: (id, params) => api.get(`/public/hotels/${id}`, { params }),
  getRoomById: (hotelId, roomId, params) => api.get(`/public/hotels/${hotelId}/rooms/${roomId}`, { params }),
};

export default publicHotelService;
