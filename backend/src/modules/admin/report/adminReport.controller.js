const service = require('./adminReport.service');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await service.getDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const { trang_thai, loai_bao_cao, tu_ngay, den_ngay } = req.query;
    const data = await service.getReports({ trang_thai, loai_bao_cao, tu_ngay, den_ngay });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const data = await service.getReportById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.acceptReport = async (req, res, next) => {
  try {
    const data = await service.acceptReport(
      req.params.id,
      req.user?.id,
      req.body?.phan_hoi_admin,
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }
    res.json({ success: true, data, message: 'Đã chấp nhận báo cáo' });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.rejectReport = async (req, res, next) => {
  try {
    const data = await service.rejectReport(
      req.params.id,
      req.user?.id,
      req.body?.phan_hoi_admin,
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }
    res.json({ success: true, data, message: 'Đã từ chối báo cáo' });
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};
