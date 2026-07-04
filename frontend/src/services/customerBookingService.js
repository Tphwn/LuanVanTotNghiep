import api from './api';

const customerBookingService = {
  getMyBookings: () => api.get('/customer/bookings'),
  getBookingById: (id) => api.get(`/customer/bookings/${id}`),
  createBooking: (data) => api.post('/customer/bookings', data),
  getCancelPreview: (id) => api.get(`/customer/bookings/${id}/cancel-preview`),
  cancelBooking: (id, lyDo) => api.patch(`/customer/bookings/${id}/cancel`, { ly_do: lyDo }),
  createReview: (bookingId, data) => api.post(`/customer/bookings/${bookingId}/review`, data),
  getReviewByBookingId: (bookingId) => api.get(`/customer/bookings/${bookingId}/review`),
};

export default customerBookingService;
