const partnerDashboardService = require('./partnerDashboard.service');

const ensurePartner = async (req, res) => {
  const userId = Number(req.user?.id || req.user?.ma_nguoi_dung);
  const doiTacId = await partnerDashboardService.getDoiTacId(userId);
  if (!doiTacId) {
    res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    return null;
  }
  return doiTacId;
};

exports.getDashboard = async (req, res) => {
  try {
    const doiTacId = await ensurePartner(req, res);
    if (!doiTacId) return;
    const data = await partnerDashboardService.getDashboard(doiTacId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
