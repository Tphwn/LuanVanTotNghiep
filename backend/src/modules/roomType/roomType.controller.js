const service = require('./roomType.service');

exports.getRooms = async (req, res) => {
  try { const data = await service.getByHotel(req.query.ma_ks); res.json({ success: true, data }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    console.log("Dữ liệu nhận từ Frontend:", req.body);
    
    const data = await service.create(req.body); 
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("LỖI TẠI CONTROLLER:", err); 
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.update = async (req, res) => {
  try { const data = await service.update(req.params.id, req.body); res.json({ success: true, data }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.delete = async (req, res) => {
  try { await service.softDelete(req.params.id); res.json({ success: true, message: 'Đã ẩn loại phòng' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};