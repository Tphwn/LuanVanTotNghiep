const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { sendMail } = require('../../utils/mailer');
const { validateEmail, validatePhone } = require('../../utils/authValidation');
const {
  signGuestLookupToken,
  verifyGuestPayToken,
  verifyGuestLookupToken,
} = require('../../utils/jwt');
const customerBookingService = require('../customer/customerBooking.service');

const OTP_TTL_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const otpStore = new Map();

const normalizePhone = (v) => String(v || '').trim().replace(/\s+/g, '');
const normalizeEmail = (v) => String(v || '').trim().toLowerCase();
const normalizeOrderCode = (v) => String(v || '').trim().toUpperCase();

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const createGuestBooking = async (body) => customerBookingService.createBooking(null, body);

const assertGuestPayAccess = (token, maDatPhong) => {
  const payload = verifyGuestPayToken(token);
  if (Number(payload.mid) !== Number(maDatPhong)) {
    throw { statusCode: 403, message: 'Không có quyền truy cập đơn này' };
  }
  return payload;
};

const assertGuestLookupAccess = (token, maDatPhong = null) => {
  const payload = verifyGuestLookupToken(token);
  if (maDatPhong != null && Number(payload.mid) !== Number(maDatPhong)) {
    throw { statusCode: 403, message: 'Không có quyền truy cập đơn này' };
  }
  return payload;
};

const requestLookupOtp = async ({ ma_don_hang, email, so_dien_thoai }) => {
  const orderCode = normalizeOrderCode(ma_don_hang);
  const mail = normalizeEmail(email);
  const phone = normalizePhone(so_dien_thoai);

  if (!orderCode) throw { statusCode: 400, message: 'Vui lòng nhập mã đặt chỗ' };
  if (!/^DH\d+$/i.test(orderCode)) {
    throw { statusCode: 400, message: 'Mã đặt chỗ không đúng định dạng (ví dụ: DH28640976417)' };
  }
  const emailErr = validateEmail(mail, { required: true });
  if (emailErr) throw { statusCode: 400, message: emailErr };
  const phoneErr = validatePhone(phone, { required: true });
  if (phoneErr) throw { statusCode: 400, message: phoneErr };

  const booking = await prisma.dat_phong.findFirst({
    where: {
      ma_don_hang: orderCode,
      ma_khach_hang: null,
      email_nguoi_nhan: mail,
      sdt_nguoi_nhan: phone,
    },
    select: {
      ma_dat_phong: true,
      ma_don_hang: true,
      email_nguoi_nhan: true,
      trang_thai: true,
      thanh_toan: { select: { trang_thai: true } },
    },
  });

  if (!booking) {
    throw { statusCode: 404, message: 'Không tìm thấy đơn phù hợp. Kiểm tra lại mã đơn, email và số điện thoại.' };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const lookupId = crypto.randomBytes(16).toString('hex');
  otpStore.set(lookupId, {
    ma_dat_phong: booking.ma_dat_phong,
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    email: mail,
  });

  try {
    await sendMail({
      to: mail,
      subject: '[Hotel Booking] Mã OTP tra cứu đặt chỗ',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e8ecea;border-radius:12px">
          <h2 style="color:#3C7363;margin:0 0 12px">Tra cứu đặt chỗ</h2>
          <p style="color:#334155;line-height:1.5">
            Mã OTP xác minh đơn <strong>${booking.ma_don_hang}</strong>:
          </p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1a2e28;margin:20px 0;text-align:center">${otp}</p>
          <p style="color:#64748b;font-size:13px;margin:0">
            Mã có hiệu lực trong <strong>1 phút</strong>. Không chia sẻ mã này cho người khác.
          </p>
        </div>
      `,
      text: `OTP tra cứu đơn ${booking.ma_don_hang}: ${otp}. Hiệu lực 1 phút.`,
    });
  } catch (err) {
    otpStore.delete(lookupId);
    throw { statusCode: 500, message: err.message || 'Không gửi được email OTP' };
  }

  return {
    lookup_id: lookupId,
    ma_don_hang: booking.ma_don_hang,
    email_masked: mail.replace(/(.{2}).+(@.+)/, '$1***$2'),
    expires_in_seconds: 60,
  };
};

const verifyLookupOtp = async ({ lookup_id, otp }) => {
  const entry = otpStore.get(String(lookup_id || ''));
  if (!entry) {
    throw { statusCode: 400, message: 'Phiên tra cứu không hợp lệ hoặc đã hết hạn. Vui lòng tra cứu lại.' };
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(lookup_id);
    throw { statusCode: 400, message: 'Mã OTP đã hết hạn. Vui lòng tra cứu lại.' };
  }
  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(lookup_id);
    throw { statusCode: 400, message: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng tra cứu lại.' };
  }

  entry.attempts += 1;
  if (hashOtp(otp) !== entry.otpHash) {
    const left = OTP_MAX_ATTEMPTS - entry.attempts;
    if (left <= 0) {
      otpStore.delete(lookup_id);
      throw { statusCode: 400, message: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng tra cứu lại.' };
    }
    throw { statusCode: 400, message: `Mã OTP không đúng. Còn ${left} lần thử.` };
  }

  otpStore.delete(lookup_id);
  const sessionToken = signGuestLookupToken(entry.ma_dat_phong);
  const booking = await customerBookingService.getBookingByIdGuest(entry.ma_dat_phong);
  return {
    session_token: sessionToken,
    booking,
  };
};

module.exports = {
  createGuestBooking,
  assertGuestPayAccess,
  assertGuestLookupAccess,
  requestLookupOtp,
  verifyLookupOtp,
  getBookingPay: (maDatPhong) => customerBookingService.getBookingByIdGuest(maDatPhong),
  getBookingLookup: (maDatPhong) => customerBookingService.getBookingByIdGuest(maDatPhong),
  confirmPayment: (maDatPhong, body) => customerBookingService.confirmPaymentGuest(maDatPhong, body),
  createVnpayPayment: (maDatPhong, ip) => customerBookingService.createVnpayPaymentGuest(maDatPhong, ip),
  applyPromo: (maDatPhong, body) => customerBookingService.applyPromoGuest(maDatPhong, body),
  removePromo: (maDatPhong) => customerBookingService.removePromoGuest(maDatPhong),
  listEligiblePromotions: (maDatPhong) => customerBookingService.listEligiblePromotionsGuest(maDatPhong),
  getCancelPreview: (maDatPhong) => customerBookingService.getCancelPreviewGuest(maDatPhong),
  cancelBooking: (maDatPhong, lyDo) => customerBookingService.cancelBookingGuest(maDatPhong, lyDo),
};
