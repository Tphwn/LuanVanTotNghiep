const service = require('./adminPromotion.service');

exports.getPromotions = async (req, res, next) => {
  try {
    const {
      loai_nguon, loai_giam, trang_thai, ma_khach_san, ma_doi_tac, keyword, tu_ngay, den_ngay,
    } = req.query;
    const filters = {
      loai_nguon, loai_giam, trang_thai, ma_khach_san, ma_doi_tac, keyword, tu_ngay, den_ngay,
    };
    const [data, stats, partners, hotels] = await Promise.all([
      service.getPromotions(filters),
      service.getStats(filters),
      service.getFilterPartners(),
      service.getFilterHotels(),
    ]);
    res.json({ success: true, data, stats, partners, hotels });
  } catch (err) {
    next(err);
  }
};

exports.getPromotionById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const data = await service.getPromotionById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createPromotion = async (req, res, next) => {
  try {
    const data = await service.createSystemPromotion(req.user.id, req.body);
    res.status(201).json({ success: true, data, message: 'Đã tạo khuyến mãi nền tảng' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.updatePromotion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const data = await service.updatePromotion(id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data, message: 'Đã cập nhật khuyến mãi' });
  } catch (err) {
    next(err);
  }
};

exports.lockPromotion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const lyDo = req.body?.ly_do?.trim();
    if (!lyDo) {
      return res.status(400).json({ success: false, message: 'Phải kèm lý do tạm ngưng' });
    }
    const data = await service.lockPromotion(id, lyDo);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data, message: 'Đã tạm ngưng khuyến mãi' });
  } catch (err) {
    next(err);
  }
};

exports.restorePromotion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const data = await service.restorePromotion(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data, message: 'Đã khôi phục khuyến mãi' });
  } catch (err) {
    next(err);
  }
};
exports.approvePromotion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const data = await service.approvePromotion(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data, message: 'Đã duyệt khuyến mãi' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.rejectPromotion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const lyDo = req.body?.ly_do?.trim();
    if (!lyDo) {
      return res.status(400).json({ success: false, message: 'Phải kèm lý do từ chối' });
    }
    const data = await service.rejectPromotion(id, lyDo);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }
    res.json({ success: true, data, message: 'Đã từ chối khuyến mãi' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};
