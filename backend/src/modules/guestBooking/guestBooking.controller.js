const guestBookingService = require('./guestBooking.service');
const { success } = require('../../utils/response');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

const readGuestToken = (req) => (
  req.headers['x-guest-token']
  || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  || req.body?.guest_token
  || req.query?.guest_token
);

exports.createBooking = async (req, res, next) => {
  try {
    const data = await guestBookingService.createGuestBooking(req.body);
    const message = data?.can_thanh_toan
      ? 'Đã tạo đơn — vui lòng hoàn tất thanh toán'
      : 'Đặt phòng thành công';
    return success(res, data, message, 201);
  } catch (err) {
    next(err);
  }
};

exports.getBookingForPay = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Mã đơn không hợp lệ' });
    }
    guestBookingService.assertGuestPayAccess(readGuestToken(req), id);
    const data = await guestBookingService.getBookingPay(id);
    return success(res, data);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.message?.includes('Token')) {
      return res.status(401).json({ success: false, message: 'Phiên thanh toán hết hạn. Vui lòng đặt lại hoặc tra cứu đơn.' });
    }
    next(err);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    guestBookingService.assertGuestPayAccess(readGuestToken(req), id);
    const data = await guestBookingService.confirmPayment(id, req.body);
    return success(res, data, 'Thanh toán thành công');
  } catch (err) {
    next(err);
  }
};

exports.createVnpayPayment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    guestBookingService.assertGuestPayAccess(readGuestToken(req), id);
    const data = await guestBookingService.createVnpayPayment(id, getClientIp(req));
    return success(res, data, 'Đã tạo URL thanh toán VNPay');
  } catch (err) {
    next(err);
  }
};

const PROMO_LOGIN_REQUIRED = 'Vui lòng đăng nhập để sử dụng mã khuyến mãi';

/** Xem danh sách / chọn mã vẫn được; chỉ chặn áp / bỏ mã khi chưa đăng nhập. */
exports.applyPromo = async (req, res) => {
  return res.status(403).json({ success: false, message: PROMO_LOGIN_REQUIRED });
};

exports.removePromo = async (req, res) => {
  return res.status(403).json({ success: false, message: PROMO_LOGIN_REQUIRED });
};

exports.listEligiblePromotions = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Mã đơn không hợp lệ' });
    }
    guestBookingService.assertGuestPayAccess(readGuestToken(req), id);
    const data = await guestBookingService.listEligiblePromotions(id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.requestLookupOtp = async (req, res, next) => {
  try {
    const data = await guestBookingService.requestLookupOtp(req.body);
    return success(res, data, 'Đã gửi mã OTP tới email của bạn');
  } catch (err) {
    next(err);
  }
};

exports.verifyLookupOtp = async (req, res, next) => {
  try {
    const data = await guestBookingService.verifyLookupOtp(req.body);
    return success(res, data, 'Xác minh thành công');
  } catch (err) {
    next(err);
  }
};

exports.getLookupBooking = async (req, res, next) => {
  try {
    const payload = guestBookingService.assertGuestLookupAccess(readGuestToken(req));
    const data = await guestBookingService.getBookingLookup(payload.mid);
    return success(res, data);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.message?.includes('Token')) {
      return res.status(401).json({ success: false, message: 'Phiên tra cứu đã hết. Vui lòng tra cứu lại.' });
    }
    next(err);
  }
};

exports.getCancelPreview = async (req, res, next) => {
  try {
    const payload = guestBookingService.assertGuestLookupAccess(readGuestToken(req));
    const data = await guestBookingService.getCancelPreview(payload.mid);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const payload = guestBookingService.assertGuestLookupAccess(readGuestToken(req));
    const data = await guestBookingService.cancelBooking(payload.mid, req.body?.ly_do);
    return success(res, data, 'Đã hủy đơn đặt phòng');
  } catch (err) {
    next(err);
  }
};
