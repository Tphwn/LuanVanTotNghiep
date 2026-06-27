import api from './api';

const customerBookingService = {
  getMyBookings: () => api.get('/customer/bookings'),
  createBooking: (data) => api.post('/customer/bookings', data),
  createReview: (bookingId, data) => api.post(`/customer/bookings/${bookingId}/review`, data),
};

export default customerBookingService;
