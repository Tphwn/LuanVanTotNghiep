const service = require('./adminRoomType.service');

exports.getRoomTypes = async (req, res, next) => {
  try {
    const { ma_dia_diem, ma_doi_tac, ma_khach_san, trang_thai, keyword } = req.query;
    const filters = { ma_dia_diem, ma_doi_tac, ma_khach_san, trang_thai, keyword };
    const [data, stats, locations, partners] = await Promise.all([
      service.getRoomTypes(filters),
      service.getStats(filters),
      service.getFilterLocations(),
      service.getFilterPartners(),
    ]);
    res.json({ success: true, data, stats, locations, partners });
  } catch (err) {
    next(err);
  }
};

exports.getRoomTypeById = async (req, res, next) => {
  try {
    const data = await service.getRoomTypeById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.hideRoomType = async (req, res, next) => {
  try {
    const data = await service.hideRoomType(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng' });
    }
    res.json({ success: true, data, message: 'Đã ẩn loại phòng' });
  } catch (err) {
    next(err);
  }
};

exports.showRoomType = async (req, res, next) => {
  try {
    const data = await service.showRoomType(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng' });
    }
    res.json({ success: true, data, message: 'Đã mở loại phòng' });
  } catch (err) {
    next(err);
  }
};
