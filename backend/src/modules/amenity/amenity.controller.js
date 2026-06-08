const amenityService = require("./amenity.service");

// GET ALL
exports.getAll = async (req, res) => {
  try {
    const data = await amenityService.findAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE
exports.create = async (req, res) => {
  try {
    const data = await amenityService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const data = await amenityService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.delete = async (req, res) => {
  try {
    await amenityService.delete(req.params.id);
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET yêu cầu tiện nghi
exports.getRequests = async (req, res) => {
  try {
    const data = await amenityService.getRequests();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Duyệt yêu cầu
exports.approveRequest = async (req, res) => {
  try {
    const data = await amenityService.approveRequest(
      req.params.id,
      req.user?.id || 1
    );
    res.json({ success: true, data, message: 'Đã duyệt và tạo tiện nghi mới' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Từ chối yêu cầu
exports.rejectRequest = async (req, res) => {
  try {
    const data = await amenityService.rejectRequest(
      req.params.id,
      req.user?.id || 1,
      req.body.phan_hoi
    );
    res.json({ success: true, data, message: 'Đã từ chối yêu cầu' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};