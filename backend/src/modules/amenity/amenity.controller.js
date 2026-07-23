const amenityService = require('./amenity.service');

const sendError = (res, err, fallbackStatus = 500) => {
  const status = err.statusCode || fallbackStatus;
  res.status(status).json({ success: false, message: err.message || 'Lỗi server' });
};

exports.getAll = async (req, res) => {
  try {
    const data = await amenityService.findAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    sendError(res, err);
  }
};

exports.listPartnersForNotify = async (req, res) => {
  try {
    const data = await amenityService.listPartnersForNotify();
    res.json({ success: true, data });
  } catch (err) {
    sendError(res, err);
  }
};

exports.create = async (req, res) => {
  try {
    const data = await amenityService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await amenityService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    sendError(res, err, 400);
  }
};

exports.delete = async (req, res) => {
  try {
    await amenityService.delete(req.params.id);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.lock = async (req, res) => {
  try {
    const data = await amenityService.setStatus(req.params.id, 'an', req.body || {});
    res.json({ success: true, data, message: 'Khóa tiện nghi thành công' });
  } catch (err) {
    sendError(res, err, 400);
  }
};

exports.unlock = async (req, res) => {
  try {
    const data = await amenityService.setStatus(req.params.id, 'hoat_dong', req.body || {});
    res.json({ success: true, data, message: 'Mở khóa tiện nghi thành công' });
  } catch (err) {
    sendError(res, err, 400);
  }
};
