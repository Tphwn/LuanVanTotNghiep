const Joi = require('joi');

const createReviewSchema = Joi.object({
  so_sao: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Điểm tổng thể là bắt buộc' }),

  diem_sach_se: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Điểm sạch sẽ là bắt buộc' }),

  diem_dich_vu: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Điểm dịch vụ là bắt buộc' }),

  diem_vi_tri: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Điểm vị trí là bắt buộc' }),

  diem_tien_nghi: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Điểm tiện nghi là bắt buộc' }),

  noi_dung: Joi.string().trim().min(1).max(2000).required()
    .messages({
      'any.required': 'Nhận xét về khách sạn là bắt buộc',
      'string.empty': 'Nhận xét về khách sạn là bắt buộc',
    }),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    });
  }
  next();
};

module.exports = { createReviewSchema, validate };