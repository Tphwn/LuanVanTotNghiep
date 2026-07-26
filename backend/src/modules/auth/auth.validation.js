const Joi = require('joi');
const {
  MSG,
  EMAIL_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  PHONE_REGEX,
  validateEmail,
  validatePassword,
  validatePhone,
} = require('../../utils/authValidation');

const emailField = Joi.string()
  .required()
  .custom((value, helpers) => {
    const err = validateEmail(value);
    if (err) return helpers.message(err);
    return value.trim();
  });

const passwordField = Joi.string()
  .required()
  .custom((value, helpers) => {
    const err = validatePassword(value);
    if (err) return helpers.message(err);
    return value;
  });

const loginPasswordField = Joi.string()
  .required()
  .custom((value, helpers) => {
    const err = validatePassword(value, { checkComplexity: false });
    if (err) return helpers.message(err);
    return value;
  });

const phoneField = Joi.string()
  .required()
  .custom((value, helpers) => {
    const err = validatePhone(value);
    if (err) return helpers.message(err);
    return String(value).trim();
  });

const registerSchema = Joi.object({
  email: emailField.max(EMAIL_MAX),
  so_dien_thoai: phoneField.pattern(PHONE_REGEX),
  mat_khau: passwordField.min(PASSWORD_MIN).max(PASSWORD_MAX),
  ho_ten: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Họ tên là bắt buộc',
    'string.min': 'Họ tên tối thiểu 2 ký tự',
  }),
});

const roleField = Joi.string()
  .valid('khach_hang', 'doi_tac', 'admin')
  .messages({
    'any.only': 'Vai trò đăng nhập không hợp lệ',
  });

const loginSchema = Joi.object({
  email: emailField,
  mat_khau: loginPasswordField,
  vai_tro: roleField.optional(),
});

const googleLoginSchema = Joi.object({
  id_token: Joi.string().required().messages({
    'any.required': 'Thiếu id_token từ Google',
  }),
});

const emailOtpSchema = Joi.object({
  email: emailField,
  otp: Joi.string().length(6).required().messages({
    'string.length': 'Mã OTP gồm 6 chữ số',
  }),
  vai_tro: roleField.optional(),
});

const resendOtpSchema = Joi.object({
  email: emailField,
  purpose: Joi.string().valid('register', 'reset').default('register'),
  vai_tro: roleField.optional(),
});

const forgotPasswordSchema = Joi.object({
  email: emailField,
  vai_tro: roleField.optional(),
});

const resetPasswordSchema = Joi.object({
  reset_token: Joi.string().required(),
  mat_khau: passwordField,
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    });
  }
  req.body = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  emailOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
  MSG,
};
