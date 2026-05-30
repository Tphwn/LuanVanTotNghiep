const Joi = require('joi');

const registerSchema = Joi.object({
  email:         Joi.string().email().required().messages({ 'string.email': 'Email không hợp lệ', 'any.required': 'Email là bắt buộc' }),
  so_dien_thoai: Joi.string().min(9).max(15).required().messages({ 'any.required': 'Số điện thoại là bắt buộc' }),
  mat_khau:      Joi.string().min(6).required().messages({ 'string.min': 'Mật khẩu ít nhất 6 ký tự', 'any.required': 'Mật khẩu là bắt buộc' }),
  ho_ten:        Joi.string().min(2).max(100).required().messages({ 'any.required': 'Họ tên là bắt buộc' }),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  mat_khau: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map(d => d.message).join(', '),
    });
  }
  next();
};

module.exports = { registerSchema, loginSchema, validate };