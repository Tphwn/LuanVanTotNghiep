const financeService = require('./finance.service');
const paymentService = require('../payment/adminPayment.service');

exports.getOverview = async (req, res) => {
  try {
    const data = await financeService.getOverview();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCommissions = async (req, res) => {
  try {
    const list = await financeService.getCommissions(req.query);
    const stats = await financeService.getCommissionStats();
    res.json({ success: true, data: { list, stats } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getRefunds = async (req, res) => {
  try {
    const list = await paymentService.getRefunds(req.query);
    const statsData = await paymentService.getStats();
    const stats = {
      tong_hoan: statsData.tong_hoan_tien,
      tong_yeu_cau: list.length,
      dang_cho: statsData.cho_xu_ly_hoan,
    };
    res.json({ success: true, data: { list, stats } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getReconciliations = async (req, res) => {
  try {
    const data = await financeService.getReconciliations();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.calculateReconciliation = async (req, res) => {
  try {
    const { thang_nam, ma_doi_tac } = req.body;
    await financeService.calculateReconciliation(thang_nam, ma_doi_tac);
    res.json({ success: true, message: 'Đã tính toán đối soát thành công' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateReconciliation = async (req, res) => {
  try {
    const { status } = req.body;
    const data = await financeService.updateReconciliationStatus(req.params.id, status);
    res.json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};