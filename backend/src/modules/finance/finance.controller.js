const financeService = require('./finance.service');

const ensurePartner = async (req, res) => {
  const doiTacId = await financeService.getDoiTacId(req.user.id);
  if (!doiTacId) {
    res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    return null;
  }
  return doiTacId;
};

exports.getHotels = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getHotels(doiTacId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getOverview(doiTacId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFinanceSummary = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getOverview(doiTacId, req.query);
    res.status(200).json({
      success: true,
      data: {
        summary: {
          gross: data.overview.tong_doanh_thu,
          commission: data.overview.hoa_hong_he_thong,
          refund: 0,
          net: data.overview.tien_doi_tac_nhan,
        },
        chartData: [],
        ...data,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getRevenueBookings(doiTacId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommissions = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getCommissions(doiTacId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayouts = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await financeService.getPayouts(doiTacId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayoutDetail = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;

    const maDot = req.query.ma_dot || req.query.thang_nam || null;

    const data = await financeService.getPayoutDetail(doiTacId, maDot);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thanh toán' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
