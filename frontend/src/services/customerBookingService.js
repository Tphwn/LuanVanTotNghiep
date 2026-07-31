import api from './api';

const customerBookingService = {
  getMyBookings: () => api.get('/customer/bookings'),
  getMyTransactions: () => api.get('/customer/bookings/transactions'),
  getMyRefunds: () => api.get('/customer/bookings/refunds'),
  getMyRefundById: (id) => api.get(`/customer/bookings/refunds/${id}`),
  getBookingById: (id) => api.get(`/customer/bookings/${id}`),
  createBooking: (data) => api.post('/customer/bookings', data),
  confirmPayment: (id, data) => api.patch(`/customer/bookings/${id}/pay`, data),
  createVnpayPayment: (id) => api.post(`/customer/bookings/${id}/pay/vnpay`),
  applyPromo: (id, data) => api.patch(`/customer/bookings/${id}/apply-promo`, data),
  getCancelPreview: (id) => api.get(`/customer/bookings/${id}/cancel-preview`),
  cancelBooking: (id, lyDo) => api.patch(`/customer/bookings/${id}/cancel`, { ly_do: lyDo }),
  createReview: (bookingId, data) => api.post(`/customer/bookings/${bookingId}/review`, data),
  getReviewByBookingId: (bookingId) => api.get(`/customer/bookings/${bookingId}/review`),
};

export default customerBookingService;
