const service = require('./adminReview.service');

exports.getReviews = async (req, res, next) => {
  try {
    const { ma_khach_san, ma_doi_tac, so_sao, trang_thai, tu_ngay, den_ngay } = req.query;

    const [data, hotels, partners] = await Promise.all([
      service.getReviews({ ma_khach_san, ma_doi_tac, so_sao, trang_thai, tu_ngay, den_ngay }),
      service.getFilterHotels(),
      service.getFilterPartners(),
    ]);
    res.json({ success: true, data, hotels, partners });
  } catch (err) {
    next(err);
  }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const data = await service.getReviewById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.hideReview = async (req, res, next) => {
  try {
    const lyDo = req.body?.ly_do?.trim();
    if (!lyDo) {
      return res.status(400).json({ success: false, message: 'Phải kèm lý do ẩn đánh giá' });
    }
    const data = await service.hideReview(req.params.id, lyDo);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã ẩn đánh giá.' });
  } catch (err) {
    next(err);
  }
};

exports.unhideReview = async (req, res, next) => {
  try {
    const data = await service.unhideReview(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã hiện lại đánh giá. ' });
  } catch (err) {
    next(err);
  }
};

exports.hidePartnerResponse = async (req, res, next) => {
  try {
    const lyDo = req.body?.ly_do?.trim();
    if (!lyDo) {
      return res.status(400).json({ success: false, message: 'Phải kèm lý do ẩn phản hồi' });
    }
    const data = await service.hidePartnerResponse(req.params.id, lyDo);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã ẩn phản hồi đối tác.' });
  } catch (err) {
    next(err);
  }
};

exports.unhidePartnerResponse = async (req, res, next) => {
  try {
    const data = await service.unhidePartnerResponse(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã hiện lại phản hồi đối tác' });
  } catch (err) {
    next(err);
  }
};
