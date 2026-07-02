const bookingService = require('../../booking/booking.service');
const { mapPartnerBooking, mapPartnerBookings } = require('../../../utils/partnerBookingMapper');

exports.getAll = async (req, res) => {
  try {
    const data = await bookingService.getAllForAdmin(req.query);
    res.json({ success: true, data: mapPartnerBookings(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await bookingService.getDetailForAdmin(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    res.json({ success: true, data: mapPartnerBooking(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { ly_do } = req.body;
    const data = await bookingService.cancelByAdmin(req.params.id, req.user?.id, ly_do);
    res.json({ success: true, data: mapPartnerBooking(data), message: 'Đã hủy đơn đặt phòng' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllHotels = async (req, res) => {
  try {
    const data = await bookingService.getHotelsForAdminFilter();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllPartners = async (req, res) => {
  try {
    const data = await bookingService.getPartnersForAdminFilter();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const data = await bookingService.getStatsForAdmin();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
