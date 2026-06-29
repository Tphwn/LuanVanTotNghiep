const partnerContactService = require('./partnerContact.service');
const { success, error } = require('../../utils/response');
const HTTP = require('../../constants/httpStatus');

exports.createRequest = async (req, res, next) => {
  try {
    const data = await partnerContactService.createRequest(req.body);
    return success(res, data, 'Đã gửi yêu cầu hợp tác thành công', HTTP.CREATED);
  } catch (err) {
    if (err.status === 400 && err.errors) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: err.message,
        errors: err.errors,
      });
    }
    next(err);
  }
};

exports.listRequests = async (req, res, next) => {
  try {
    const data = await partnerContactService.listRequests(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const data = await partnerContactService.getRequestStats();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return error(res, 'ID không hợp lệ', HTTP.BAD_REQUEST);
    }
    const data = await partnerContactService.getRequestById(id);
    return success(res, data);
  } catch (err) {
    if (err.status === 404) return error(res, err.message, HTTP.NOT_FOUND);
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return error(res, 'ID không hợp lệ', HTTP.BAD_REQUEST);
    }
    const adminId = parseInt(req.user?.id || req.user?.ma_nguoi_dung, 10);
    const data = await partnerContactService.updateStatus(id, adminId, req.body);
    return success(res, data, 'Đã cập nhật trạng thái yêu cầu');
  } catch (err) {
    if (err.status === 404) return error(res, err.message, HTTP.NOT_FOUND);
    if (err.status === 400) return error(res, err.message, HTTP.BAD_REQUEST);
    next(err);
  }
};
