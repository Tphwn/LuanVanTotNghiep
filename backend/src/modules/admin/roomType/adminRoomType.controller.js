const service = require('./adminRoomType.service');

exports.getRoomTypes = async (req, res, next) => {
  try {
    const { ma_khach_san, ma_doi_tac, trang_thai, keyword } = req.query;
    const [data, stats, hotels, partners] = await Promise.all([
      service.getRoomTypes({ ma_khach_san, ma_doi_tac, trang_thai, keyword }),
      service.getStats(),
      service.getFilterHotels(),
      service.getFilterPartners(),
    ]);
    res.json({ success: true, data, stats, hotels, partners });
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
