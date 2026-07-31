const EMAIL_MAX = 50;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 30;
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LETTER = /[A-Za-zÀ-ỹ]/;
const HAS_DIGIT = /\d/;

const MSG = {
  EMAIL_REQUIRED: 'Email không được để trống.',
  EMAIL_FORMAT: 'Email không đúng định dạng.',
  EMAIL_MAX: 'Email tối đa 50 ký tự.',
  EMAIL_NO_SPACE: 'Email không được chứa khoảng trắng.',
  EMAIL_EXISTS: 'Email đã được đăng ký vui lòng chọn email khác.',

  PASSWORD_REQUIRED: 'Mật khẩu không được để trống.',
  PASSWORD_MIN: 'Mật khẩu phải có ít nhất 6 ký tự.',
  PASSWORD_MAX: 'Mật khẩu tối đa 30 ký tự.',
  PASSWORD_LETTER_NUMBER: 'Mật khẩu phải bao gồm chữ cái và số.',
  PASSWORD_CONFIRM_MISMATCH: 'Xác nhận mật khẩu không khớp.',
  PASSWORD_CURRENT_WRONG: 'Mật khẩu hiện tại không chính xác.',
  PASSWORD_SAME_AS_OLD: 'Mật khẩu mới không được trùng mật khẩu hiện tại.',

  PHONE_REQUIRED: 'Số điện thoại không được để trống.',
  PHONE_LENGTH: 'Số điện thoại phải gồm đúng 10 số.',
  PHONE_START: 'Số điện thoại phải bắt đầu bằng 0.',
  PHONE_DIGITS: 'Số điện thoại không được chứa chữ cái.',
  PHONE_EXISTS: 'Số điện thoại đã được sử dụng bởi tài khoản khác.',
};

const validateEmail = (email, { required = true } = {}) => {
  const value = String(email ?? '');
  if (!value.trim()) {
    return required ? MSG.EMAIL_REQUIRED : null;
  }
  if (/\s/.test(value)) return MSG.EMAIL_NO_SPACE;
  if (value.length > EMAIL_MAX) return MSG.EMAIL_MAX;
  if (!EMAIL_REGEX.test(value)) return MSG.EMAIL_FORMAT;
  return null;
};

const validatePassword = (password, { required = true, checkComplexity = true } = {}) => {
  const value = String(password ?? '');
  if (!value) {
    return required ? MSG.PASSWORD_REQUIRED : null;
  }
  if (value.length < PASSWORD_MIN) return MSG.PASSWORD_MIN;
  if (value.length > PASSWORD_MAX) return MSG.PASSWORD_MAX;
  if (checkComplexity && (!HAS_LETTER.test(value) || !HAS_DIGIT.test(value))) {
    return MSG.PASSWORD_LETTER_NUMBER;
  }
  return null;
};

const validatePasswordConfirm = (password, confirm) => {
  if (String(password ?? '') !== String(confirm ?? '')) {
    return MSG.PASSWORD_CONFIRM_MISMATCH;
  }
  return null;
};

const validateNewPasswordNotSame = (currentPassword, newPassword) => {
  if (String(currentPassword ?? '') === String(newPassword ?? '')) {
    return MSG.PASSWORD_SAME_AS_OLD;
  }
  return null;
};

const validatePhone = (phone, { required = true } = {}) => {
  const value = String(phone ?? '').trim();
  if (!value) {
    return required ? MSG.PHONE_REQUIRED : null;
  }
  if (/[A-Za-zÀ-ỹ]/.test(value)) return MSG.PHONE_DIGITS;
  if (!value.startsWith('0')) return MSG.PHONE_START;
  if (!/^\d+$/.test(value) || value.length !== 10) return MSG.PHONE_LENGTH;
  if (!PHONE_REGEX.test(value)) return MSG.PHONE_LENGTH;
  return null;
};

const validateChangePassword = ({ mat_khau_cu, mat_khau_moi, xac_nhan_mat_khau }) => {
  const currentErr = validatePassword(mat_khau_cu, { checkComplexity: false });
  if (currentErr) {
    return currentErr === MSG.PASSWORD_REQUIRED
      ? 'Mật khẩu hiện tại không được để trống.'
      : currentErr;
  }

  const newErr = validatePassword(mat_khau_moi);
  if (newErr) return newErr;

  const sameErr = validateNewPasswordNotSame(mat_khau_cu, mat_khau_moi);
  if (sameErr) return sameErr;

  const confirmErr = validatePasswordConfirm(mat_khau_moi, xac_nhan_mat_khau);
  if (confirmErr) return confirmErr;

  return null;
};

module.exports = {
  MSG,
  EMAIL_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  PHONE_REGEX,
  EMAIL_REGEX,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNewPasswordNotSame,
  validatePhone,
  validateChangePassword,
};
