const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../../config/prisma');
const { hash, compare } = require('../../utils/hashPassword');
const { generateToken } = require('../../utils/jwt');
const { sendOtpEmail } = require('../../utils/mailer');
const MSG = require('../../constants/messages');
const {
  validatePassword,
} = require('../../utils/authValidation');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const OTP_TTL_MS = 10 * 60 * 1000;

const buildOtpMeta = (hetHan) => {
  const expires = hetHan instanceof Date ? hetHan : new Date(hetHan);
  return {
    otp_het_han: expires.toISOString(),
    otp_ttl_seconds: Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000)),
  };
};
const SHARED_PORTAL_ROLES = new Set(['khach_hang', 'doi_tac']);

const assertPortalRole = (nguoiDung, vai_tro) => {
  if (vai_tro) {
    if (nguoiDung.vai_tro !== vai_tro) {
      throw { statusCode: 403, message: MSG.WRONG_PORTAL, code: 'WRONG_PORTAL' };
    }
    return;
  }
  if (!SHARED_PORTAL_ROLES.has(nguoiDung.vai_tro)) {
    throw { statusCode: 403, message: MSG.WRONG_PORTAL, code: 'WRONG_PORTAL' };
  }
};
//hàm tạo dữ liệu trả về cho client
const buildAuthPayload = (nguoiDung, hoTen = null) => ({
  token: generateToken({
    id: nguoiDung.ma_nguoi_dung,
    vai_tro: nguoiDung.vai_tro,
  }),
  user: {
    id: nguoiDung.ma_nguoi_dung,
    email: nguoiDung.email,
    vai_tro: nguoiDung.vai_tro,
    so_dien_thoai: nguoiDung.so_dien_thoai,
    ho_ten: hoTen || nguoiDung.khach_hang?.ho_ten || null,
  },
});
//hàm tạo mã OTP
const generateOtp = () => String(crypto.randomInt(100000, 999999));
//hàm lưu mã OTP vào database
const setUserOtp = async (maNguoiDung, otp, purpose) => {
  const hetHan = new Date(Date.now() + OTP_TTL_MS);
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: maNguoiDung },
    data: {
      otp_code: otp,
      otp_het_han: hetHan,
      reset_token: purpose === 'reset' ? null : purpose,
      token_het_han: purpose === 'reset' ? null : hetHan,
    },
  });
  return hetHan;
};

const assertOtpValid = (user, otp) => {
  if (!user?.otp_code || !user?.otp_het_han) {
    throw { statusCode: 400, message: 'Không có mã OTP đang chờ xác thực' };
  }
  if (new Date(user.otp_het_han).getTime() < Date.now()) {
    throw { statusCode: 400, message: 'Mã OTP đã hết hạn. Vui lòng nhấn gửi lại mã mới' };
  }
  if (String(user.otp_code) !== String(otp).trim()) {
    throw { statusCode: 400, message: 'Mã OTP không đúng' };
  }
};
//hàm xóa mã OTP khỏi database
const clearOtp = async (maNguoiDung) => {
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: maNguoiDung },
    data: {
      otp_code: null,
      otp_het_han: null,
    },
  });
};

const register = async ({ email, so_dien_thoai, mat_khau, ho_ten }) => {
  const emailExists = await prisma.nguoi_dung.findUnique({ where: { email } });
  if (emailExists) {
    if (emailExists.trang_thai === 'bi_khoa') {
      throw { statusCode: 403, message: MSG.EMAIL_LOCKED, code: 'EMAIL_LOCKED' };
    }
    if (emailExists.reset_token === 'register' && emailExists.vai_tro === 'khach_hang') {
      const otp = generateOtp();
      const hetHan = await setUserOtp(emailExists.ma_nguoi_dung, otp, 'register');
      await sendOtpEmail({ to: email, otp, purpose: 'register' });
      return {
        needs_otp: true,
        email,
        message: 'Email đã đăng ký nhưng chưa xác thực. Đã gửi lại mã OTP.',
        ...buildOtpMeta(hetHan),
      };
    }
    throw { statusCode: 400, message: MSG.EMAIL_EXISTS };
  }
  const phoneExists = await prisma.nguoi_dung.findUnique({ where: { so_dien_thoai } });
  if (phoneExists) throw { statusCode: 400, message: MSG.PHONE_EXISTS };
  const matKhauHash = await hash(mat_khau);
  const otp = generateOtp();
  const otpHetHan = new Date(Date.now() + OTP_TTL_MS);
  const nguoiDung = await prisma.nguoi_dung.create({
    data: {
      email,
      so_dien_thoai,
      mat_khau: matKhauHash,
      vai_tro: 'khach_hang',
      otp_code: otp,
      otp_het_han: otpHetHan,
      reset_token: 'register',
      token_het_han: otpHetHan,
    },
  });
  await prisma.khach_hang.create({
    data: {
      ma_nguoi_dung: nguoiDung.ma_nguoi_dung,
      ho_ten,
    },
  });

  try {
    await sendOtpEmail({ to: email, otp, purpose: 'register' });
  } catch (err) {
    await prisma.khach_hang.deleteMany({ where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung } });
    await prisma.nguoi_dung.delete({ where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung } });
    throw {
      statusCode: 500,
      message: `Không gửi được email OTP: ${err.message || 'lỗi SMTP'}`,
    };
  }
  return {
    needs_otp: true,
    email,
    message: 'Đã gửi mã OTP tới email. Vui lòng xác thực để hoàn tất đăng ký.',
    ...buildOtpMeta(otpHetHan),
  };
};

const verifyRegisterOtp = async ({ email, otp }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { email },
    include: { khach_hang: true },
  });
  if (!nguoiDung) throw { statusCode: 404, message: 'Không tìm thấy tài khoản đăng ký' };
  if (nguoiDung.vai_tro !== 'khach_hang') {
    throw { statusCode: 400, message: 'Không thể xác thực loại tài khoản này' };
  }

  assertOtpValid(nguoiDung, otp);
  if (nguoiDung.reset_token !== 'register') {
    throw { statusCode: 400, message: 'Tài khoản không đang chờ xác thực đăng ký' };
  }

  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: {
      otp_code: null,
      otp_het_han: null,
      reset_token: null,
      token_het_han: null,
      dang_nhap_cuoi: new Date(),
    },
  });

  const fresh = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    include: { khach_hang: true },
  });

  return buildAuthPayload(fresh);
};
//hàm gửi lại mã OTP
const resendOtp = async ({ email, purpose = 'register', vai_tro }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({ where: { email } });
  if (!nguoiDung) {
    if (purpose === 'register') {
      throw { statusCode: 404, message: 'Không tìm thấy tài khoản cần xác thực' };
    }
    throw {
      statusCode: 404,
      message: 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.',
    };
  }
  if (nguoiDung.trang_thai === 'bi_khoa') {
    throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
  }
  if (purpose === 'register') {
    if (nguoiDung.reset_token !== 'register') {
      throw { statusCode: 400, message: 'Tài khoản đã được xác thực email' };
    }
  } else if (purpose === 'reset') {
    assertPortalRole(nguoiDung, vai_tro);
  }
  const otpPurpose = purpose === 'reset' ? 'reset' : 'register';
  const otp = generateOtp();
  const hetHan = await setUserOtp(nguoiDung.ma_nguoi_dung, otp, otpPurpose);
  await sendOtpEmail({ to: email, otp, purpose: otpPurpose });
  return {
    message: 'Đã gửi lại mã OTP tới email',
    email,
    ...buildOtpMeta(hetHan),
  };
};

const login = async ({ email, mat_khau, vai_tro }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { email },
    include: { khach_hang: true },
  });
  if (!nguoiDung) throw { statusCode: 401, message: MSG.INVALID_CREDENTIALS };
  if (nguoiDung.trang_thai === 'bi_khoa') throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
  assertPortalRole(nguoiDung, vai_tro);
  if (nguoiDung.otp_code && nguoiDung.reset_token === 'register') {
    throw {
      statusCode: 403,
      message: 'Email chưa được xác thực. Vui lòng nhập mã OTP đã gửi tới email của bạn.',
      code: 'EMAIL_NOT_VERIFIED',
      email,
    };
  }
  const isMatch = await compare(mat_khau, nguoiDung.mat_khau);
  if (!isMatch) throw { statusCode: 401, message: MSG.INVALID_CREDENTIALS };
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: { dang_nhap_cuoi: new Date() },
  });

  return buildAuthPayload(nguoiDung);
};
const loginWithGoogle = async ({ id_token: idToken }) => {
  if (!idToken) throw { statusCode: 400, message: 'Thiếu id_token từ Google' };
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw { statusCode: 500, message: 'Chưa cấu hình GOOGLE_CLIENT_ID trên server' };
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw { statusCode: 401, message: 'Token Google không hợp lệ' };
  }
  const googleId = payload?.sub;
  const email = payload?.email;
  const hoTen = payload?.name || email?.split('@')[0] || 'Khách Google';
  const anhDaiDien = payload?.picture || null;
  if (!googleId || !email) {
    throw { statusCode: 400, message: 'Không lấy được thông tin tài khoản Google' };
  }
  if (payload.email_verified === false) {
    throw { statusCode: 400, message: 'Email Google chưa được xác minh' };
  }
  let found = await prisma.$queryRaw`
    SELECT ma_nguoi_dung FROM nguoi_dung WHERE google_id = ${googleId} LIMIT 1
  `;
  let userId = found?.[0]?.ma_nguoi_dung ? Number(found[0].ma_nguoi_dung) : null;
  if (!userId) {
    const byEmail = await prisma.nguoi_dung.findUnique({
      where: { email },
      include: { khach_hang: true },
    });
    if (byEmail) {
      if (byEmail.trang_thai === 'bi_khoa') {
        throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
      }
      if (byEmail.vai_tro !== 'khach_hang') {
        throw {
          statusCode: 403,
          message: 'Tài khoản đối tác/admin vui lòng đăng nhập bằng email và mật khẩu',
        };
      }
      await prisma.$executeRaw`
        UPDATE nguoi_dung
        SET google_id = ${googleId},
            dang_nhap_cuoi = NOW(),
            otp_code = NULL,
            otp_het_han = NULL,
            reset_token = NULL,
            token_het_han = NULL
        WHERE ma_nguoi_dung = ${byEmail.ma_nguoi_dung}
      `;
      userId = byEmail.ma_nguoi_dung;
      if (!byEmail.khach_hang) {
        await prisma.khach_hang.create({
          data: {
            ma_nguoi_dung: userId,
            ho_ten: hoTen,
            anh_dai_dien: anhDaiDien,
          },
        });
      }
    } else {
      const phonePlaceholder = `g${googleId.slice(-12)}`.slice(0, 15);
      const randomPassword = await hash(crypto.randomBytes(32).toString('hex'));

const created = await prisma.nguoi_dung.create({
        data: {
          email,
          so_dien_thoai: phonePlaceholder,
          mat_khau: randomPassword,
          vai_tro: 'khach_hang',
        },
      });
      await prisma.$executeRaw`
        UPDATE nguoi_dung SET google_id = ${googleId} WHERE ma_nguoi_dung = ${created.ma_nguoi_dung}
      `;
      await prisma.khach_hang.create({
        data: {
          ma_nguoi_dung: created.ma_nguoi_dung,
          ho_ten: hoTen,
          anh_dai_dien: anhDaiDien,
        },
      });
      userId = created.ma_nguoi_dung;
    }
  } else {
    const existing = await prisma.nguoi_dung.findUnique({
      where: { ma_nguoi_dung: userId },
    });
    if (!existing) throw { statusCode: 404, message: MSG.NOT_FOUND };
    if (existing.trang_thai === 'bi_khoa') throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
    if (existing.vai_tro !== 'khach_hang') {
      throw {
        statusCode: 403,
        message: 'Tài khoản đối tác/admin vui lòng đăng nhập bằng email và mật khẩu',
      };
    }

    await prisma.nguoi_dung.update({
      where: { ma_nguoi_dung: userId },
      data: { dang_nhap_cuoi: new Date() },
    });
  }

  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: userId },
    include: { khach_hang: true },
  });

  return buildAuthPayload(nguoiDung);
};
//hàm quên mật khẩu
const forgotPassword = async ({ email, vai_tro }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({ where: { email } });
  if (!nguoiDung) {
    throw {
      statusCode: 404,
      message: 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.',
    };
  }
  if (nguoiDung.trang_thai === 'bi_khoa') {
    throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
  }
  assertPortalRole(nguoiDung, vai_tro);

  const otp = generateOtp();
  const otpHetHan = new Date(Date.now() + OTP_TTL_MS);
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: {
      otp_code: otp,
      otp_het_han: otpHetHan,
      reset_token: null,
      token_het_han: null,
    },
  });

  try {
    await sendOtpEmail({ to: email, otp, purpose: 'reset' });
  } catch (err) {
    throw {
      statusCode: 500,
      message: `Không gửi được email OTP: ${err.message || 'lỗi SMTP'}`,
    };
  }

  return {
    message: 'Mã OTP đã được gửi.',
    email,
    ...buildOtpMeta(otpHetHan),
  };
};

const verifyResetOtp = async ({ email, otp, vai_tro }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({ where: { email } });
  if (!nguoiDung) throw { statusCode: 404, message: 'Không tìm thấy tài khoản' };
  if (nguoiDung.trang_thai === 'bi_khoa') throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
  assertPortalRole(nguoiDung, vai_tro);

  assertOtpValid(nguoiDung, otp);
  if (nguoiDung.reset_token === 'register') {
    throw { statusCode: 400, message: 'Tài khoản chưa hoàn tất đăng ký. Vui lòng xác thực email đăng ký trước' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHetHan = new Date(Date.now() + OTP_TTL_MS);

  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: {
      otp_code: null,
      otp_het_han: null,
      reset_token: resetToken,
      token_het_han: tokenHetHan,
    },
  });

  return {
    reset_token: resetToken,
    email,
    message: 'Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.',
  };
};
const resetPassword = async ({ reset_token: resetToken, mat_khau }) => {
  if (!resetToken) {
    throw { statusCode: 400, message: 'Thiếu thông tin đặt lại mật khẩu' };
  }
  const pwdErr = validatePassword(mat_khau);
  if (pwdErr) throw { statusCode: 400, message: pwdErr };

  const nguoiDung = await prisma.nguoi_dung.findFirst({
    where: { reset_token: resetToken },
  });
  if (!nguoiDung) throw { statusCode: 400, message: 'Token đặt lại mật khẩu không hợp lệ' };
  if (!nguoiDung.token_het_han || new Date(nguoiDung.token_het_han).getTime() < Date.now()) {
    throw { statusCode: 400, message: 'Token đặt lại mật khẩu đã hết hạn' };
  }

  const matKhauHash = await hash(mat_khau);
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: {
      mat_khau: matKhauHash,
      reset_token: null,
      token_het_han: null,
      otp_code: null,
      otp_het_han: null,
    },
  });

  return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' };
};

const getMe = async (userId) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: userId },
    select: {
      ma_nguoi_dung: true,
      email: true,
      so_dien_thoai: true,
      vai_tro: true,
      trang_thai: true,
      ngay_tao: true,
      dang_nhap_cuoi: true,
      khach_hang: {
        select: { ho_ten: true, anh_dai_dien: true, ngay_sinh: true, gioi_tinh: true },
      },
    },
  });
  if (!nguoiDung) throw { statusCode: 404, message: MSG.NOT_FOUND };
  if (nguoiDung.trang_thai === 'bi_khoa') {
    throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' };
  }
  return nguoiDung;
};

module.exports = {
  register,
  verifyRegisterOtp,
  resendOtp,
  login,
  loginWithGoogle,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
};
