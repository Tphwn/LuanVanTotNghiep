const service = require('./adminReview.service');

exports.getReviews = async (req, res, next) => {
  try {
    const { ma_khach_san, so_sao, trang_thai, tu_ngay, den_ngay } = req.query;
    const [data, hotels] = await Promise.all([
      service.getReviews({ ma_khach_san, so_sao, trang_thai, tu_ngay, den_ngay }),
      service.getFilterHotels(),
    ]);
    res.json({ success: true, data, hotels });
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
    const data = await service.hideReview(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã ẩn đánh giá' });
  } catch (err) {
    next(err);
  }
};

exports.showReview = async (req, res, next) => {
  try {
    const data = await service.showReview(req.params.id, req.user?.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã hiện đánh giá' });
  } catch (err) {
    next(err);
  }
};
