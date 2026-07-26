const authService = require('./auth.service');
const { success, error } = require('../../utils/response');
const MSG = require('../../constants/messages');
const HTTP = require('../../constants/httpStatus');

const handle = (fn, successMsg, status = HTTP.OK) => async (req, res) => {
  try {
    const data = await fn(req);
    return success(res, data, successMsg, status);
  } catch (err) {
    const payload = { message: err.message };
    if (err.code) payload.code = err.code;
    if (err.email) payload.email = err.email;
    return res.status(err.statusCode || HTTP.SERVER_ERROR).json({
      success: false,
      ...payload,
    });
  }
};

exports.register = handle(
  (req) => authService.register(req.body),
  'Đã gửi mã OTP tới email',
  HTTP.CREATED,
);

exports.verifyRegisterOtp = handle(
  (req) => authService.verifyRegisterOtp(req.body),
  MSG.REGISTER_SUCCESS,
);

exports.resendOtp = handle(
  (req) => authService.resendOtp(req.body),
  'Đã gửi lại mã OTP',
);

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    return success(res, data, MSG.LOGIN_SUCCESS, HTTP.OK);
  } catch (err) {
    return res.status(err.statusCode || HTTP.SERVER_ERROR).json({
      success: false,
      message: err.message,
      code: err.code,
      email: err.email,
    });
  }
};

exports.loginWithGoogle = handle(
  (req) => authService.loginWithGoogle(req.body),
  MSG.LOGIN_SUCCESS,
);

exports.forgotPassword = handle(
  (req) => authService.forgotPassword(req.body),
  'Mã OTP đã được gửi.',
);

exports.verifyResetOtp = handle(
  (req) => authService.verifyResetOtp(req.body),
  'Xác thực OTP thành công',
);

exports.resetPassword = handle(
  (req) => authService.resetPassword(req.body),
  'Đặt lại mật khẩu thành công',
);

exports.getMe = handle(
  (req) => authService.getMe(req.user.id),
  MSG.SUCCESS,
);
