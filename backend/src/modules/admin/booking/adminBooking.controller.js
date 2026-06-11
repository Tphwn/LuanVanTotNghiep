const adminBookingService = require('./adminBooking.service');

exports.getAll = async (req, res) => {
  try {
    const data = await adminBookingService.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await adminBookingService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { ly_do } = req.body;
    if (!ly_do?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy' });
    }
    const data = await adminBookingService.cancelBooking(
      req.params.id,
      req.user.id,
      ly_do
    );
    res.json({ success: true, data, message: 'Đã hủy đơn đặt phòng' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllHotels = async (req, res) => {
  try {
    const data = await adminBookingService.getAllHotels();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const data = await adminBookingService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};