import api from './api';

const guestHeaders = (token) => (
  token ? { 'X-Guest-Token': token } : {}
);

const createBooking = (payload) => api.post('/public/guest-bookings', payload);

const getBookingForPay = (id, token) => api.get(`/public/guest-bookings/pay/${id}`, {
  headers: guestHeaders(token),
});

const confirmPayment = (id, body, token) => api.patch(`/public/guest-bookings/pay/${id}/pay`, body, {
  headers: guestHeaders(token),
});

const createVnpayPayment = (id, token) => api.post(`/public/guest-bookings/pay/${id}/pay/vnpay`, {}, {
  headers: guestHeaders(token),
});

const applyPromo = (id, data, token) => api.patch(`/public/guest-bookings/pay/${id}/apply-promo`, data, {
  headers: guestHeaders(token),
});

const removePromo = (id, token) => api.patch(`/public/guest-bookings/pay/${id}/remove-promo`, {}, {
  headers: guestHeaders(token),
});

const getEligiblePromotions = (id, token) => api.get(`/public/guest-bookings/pay/${id}/eligible-promotions`, {
  headers: guestHeaders(token),
});

const requestLookupOtp = (body) => api.post('/public/guest-bookings/lookup', body);

const verifyLookupOtp = (body) => api.post('/public/guest-bookings/lookup/verify-otp', body);

const getLookupBooking = (token) => api.get('/public/guest-bookings/lookup/booking', {
  headers: guestHeaders(token),
});

const getCancelPreview = (token) => api.get('/public/guest-bookings/lookup/cancel-preview', {
  headers: guestHeaders(token),
});

const cancelBooking = (token, lyDo) => api.patch('/public/guest-bookings/lookup/cancel', { ly_do: lyDo }, {
  headers: guestHeaders(token),
});

export const guestPayTokenKey = (bookingId) => `guestPay:${bookingId}`;
export const GUEST_LOOKUP_TOKEN_KEY = 'guestLookupToken';

export default {
  createBooking,
  getBookingForPay,
  confirmPayment,
  createVnpayPayment,
  applyPromo,
  removePromo,
  getEligiblePromotions,
  requestLookupOtp,
  verifyLookupOtp,
  getLookupBooking,
  getCancelPreview,
  cancelBooking,
};
