const customerBookingService = require('./customerBooking.service');
const { success } = require('../../utils/response');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

exports.createVnpayPayment = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.ma_nguoi_dung;
    const data = await customerBookingService.createVnpayPayment(
      userId,
      req.params.id,
      getClientIp(req)
    );
    return success(res, data, 'Đã tạo URL thanh toán VNPay');
  } catch (err) {
    next(err);
  }
};

exports.vnpayReturn = async (req, res, next) => {
  try {
    const result = await customerBookingService.handleVnpayReturn(req.query);
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('vnpay', result.vnpay || 'fail');
    if (result.message) params.set('message', result.message);
    const target = `${frontend}${result.redirectPath}?${params.toString()}`;
    return res.redirect(302, target);
  } catch (err) {
    next(err);
  }
};
