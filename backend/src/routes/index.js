const { auth, adminGuard } = require('../middlewares');

const registerRoutes = (app) => {
  app.use('/api/auth', require('../modules/auth/auth.routes'));

  app.use('/api/admin/users', ...adminGuard, require('../modules/admin/user/adminUser.routes'));
  app.use('/api/admin/hotels', ...adminGuard, require('../modules/admin/hotel/hotel.routes'));
  app.use('/api/admin/room-types', ...adminGuard, require('../modules/admin/roomType/adminRoomType.routes'));
  app.use('/api/admin/reviews', ...adminGuard, require('../modules/admin/review/adminReview.routes'));
  app.use('/api/admin/reports', ...adminGuard, require('../modules/admin/report/adminReport.routes'));
  app.use('/api/admin/analytics', ...adminGuard, require('../modules/admin/analytics/analytics.routes'));
  app.use('/api/admin/bookings', ...adminGuard, require('../modules/admin/booking/adminBooking.routes'));
  app.use('/api/admin/payments', ...adminGuard, require('../modules/admin/payment/adminPayment.routes'));
  app.use('/api/admin/finance', ...adminGuard, require('../modules/admin/finance/finance.routes'));
  app.use('/api/admin/promotions', ...adminGuard, require('../modules/admin/promotion/adminPromotion.routes'));

  app.use('/api/partner/rooms', require('../modules/roomType/roomType.routes'));
  app.use('/api/partner/hotels', require('../modules/hotel/hotel.routes'));
  app.use('/api/partner/bookings', require('../modules/booking/booking.routes'));
  app.use('/api/partner/pricing', require('../modules/pricing/pricing.routes'));
  app.use('/api/partner/promotions', require('../modules/promotion/partnerPromotion.routes'));
  app.use('/api/partner/reviews', require('../modules/review/partnerReview.routes'));
  app.use('/api/partner/account', require('../modules/account/partnerAccount.routes'));
  app.use('/api/customer/account', require('../modules/account/customerAccount.routes'));
  app.use('/api/partner/finance', require('../modules/finance/finance.routes'));
  app.use('/api/partner/dashboard', require('../modules/dashboard/partnerDashboard.routes'));
  app.use('/api/partner/notifications', require('../modules/notification/partnerNotification.routes'));
  app.use('/api/admin/notifications', ...adminGuard, require('../modules/notification/adminNotification.routes'));

  app.use('/api/amenities/requests', require('../modules/amenity/amenityRequest.routes'));
  app.use('/api/amenities', require('../modules/amenity/amenity.routes'));

  app.use('/api/public', require('../modules/public/publicHotel.routes'));
  app.use('/api/public/partner-contact', require('../modules/partnerContact/partnerContact.routes'));
  app.use('/api/public/guest-bookings', require('../modules/guestBooking/guestBooking.routes'));
  app.use('/api/customer/bookings', require('../modules/customer/customerBooking.routes'));
  app.use('/api/customer/payments', require('../modules/customer/customerPayment.routes'));

  app.use('/api/admin/partner-requests', ...adminGuard, require('../modules/admin/partnerRequest/adminPartnerRequest.routes'));
};

module.exports = registerRoutes;
