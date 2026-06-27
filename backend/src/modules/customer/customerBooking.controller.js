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

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.createBooking(userId, req.body);
    return success(res, data, 'Đặt phòng thành công', 201);
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

module.exports = { getMyBookings, createBooking, createReview };
