import api from './api';

const customerBookingService = {
  getMyBookings: () => api.get('/customer/bookings'),
  createBooking: (data) => api.post('/customer/bookings', data),
};

export default customerBookingService;
