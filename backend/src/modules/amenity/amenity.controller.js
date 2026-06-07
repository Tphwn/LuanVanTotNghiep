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