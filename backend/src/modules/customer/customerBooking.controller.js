const customerBookingService = require('./customerBooking.service');
const { success } = require('../../utils/response');

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getMyBookings(userId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getMyTransactions(userId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMyRefunds = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getMyRefunds(userId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMyRefundById = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getMyRefundById(userId, req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.createBooking(userId, req.body);
    const message = data?.can_thanh_toan
      ? 'Đã tạo đơn — vui lòng hoàn tất thanh toán'
      : 'Đặt phòng thành công';
    return success(res, data, message, 201);
  } catch (err) {
    next(err);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.confirmPayment(userId, req.params.id, req.body);
    return success(res, data, 'Thanh toán thành công');
  } catch (err) {
    next(err);
  }
};

const applyPromo = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.applyPromo(userId, req.params.id, req.body);
    return success(res, data, 'Áp mã khuyến mãi thành công');
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.createReview(userId, req.params.id, req.body);
    return success(res, data, 'Đã gửi đánh giá', 201);
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.cancelBooking(userId, req.params.id, req.body?.ly_do);
    return success(res, data, 'Đã hủy đơn đặt phòng');
  } catch (err) {
    next(err);
  }
};

const getCancelPreview = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getCancelPreview(userId, req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};
const getBookingById = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getBookingById(userId, req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getReviewByBookingId = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.getReviewByBookingId(userId, req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyBookings,
  getMyTransactions,
  getMyRefunds,
  getMyRefundById,
  getBookingById,
  getReviewByBookingId,
  createBooking,
  confirmPayment,
  applyPromo,
  createReview,
  cancelBooking,
  getCancelPreview,
};
