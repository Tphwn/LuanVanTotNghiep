const service = require('./adminReview.service');

exports.getReviews = async (req, res, next) => {
  try {
    const { ma_khach_san, ma_doi_tac, so_sao, trang_thai, tu_ngay, den_ngay } = req.query;
    const hasScope = Boolean(ma_khach_san || ma_doi_tac);

    const emptyData = {
      stats: {
        diem_trung_binh: 0,
        tong_danh_gia: 0,
        hien_thi: 0,
        an: 0,
        bi_bao_cao: 0,
        chua_phan_hoi: 0,
        phan_bo_sao: [],
        theo_khach_san: [],
      },
      danh_sach: [],
    };

    const [data, hotels, partners] = await Promise.all([
      hasScope
        ? service.getReviews({ ma_khach_san, ma_doi_tac, so_sao, trang_thai, tu_ngay, den_ngay })
        : Promise.resolve(emptyData),
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
    const data = await service.hideReview(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    res.json({ success: true, data, message: 'Đã ẩn đánh giá' });
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
    res.json({ success: true, data, message: 'Đã hiện lại đánh giá' });
  } catch (err) {
    next(err);
  }
};
