const { buildPartnerRefundInfo } = require('./refundHelpers');

const mapPartnerBooking = (booking) => {
  if (!booking) return null;
  return {
    ...booking,
    thong_tin_hoan_tien: buildPartnerRefundInfo(booking),
  };
};

const mapPartnerBookings = (bookings) =>
  (bookings || []).map(mapPartnerBooking);

module.exports = { mapPartnerBooking, mapPartnerBookings };
