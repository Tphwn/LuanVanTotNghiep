const amenityService = require('./amenity.service');

exports.getAll = async (req, res) => {
  try {
    const data = await amenityService.findAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listPartnersForNotify = async (req, res) => {
  try {
    const data = await amenityService.listPartnersForNotify();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await amenityService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await amenityService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await amenityService.delete(req.params.id);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lock = async (req, res) => {
  try {
    const data = await amenityService.setStatus(req.params.id, 'an');
    res.json({ success: true, data, message: 'Đã khóa tiện nghi' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.unlock = async (req, res) => {
  try {
    const data = await amenityService.setStatus(req.params.id, 'hoat_dong');
    res.json({ success: true, data, message: 'Đã mở khóa tiện nghi' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
