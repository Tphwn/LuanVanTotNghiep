const svc = require('./adminPayment.service');

const wrap = (fn) => async (req, res) => {
  try {
    const data = await fn(req, res);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getStats          = wrap(async (req) => svc.getStats());
exports.getTransactions   = wrap(async (req) => svc.getTransactions(req.query));
exports.getTransactionById= wrap(async (req) => svc.getTransactionById(req.params.id));
exports.getRefunds        = wrap(async (req) => svc.getRefunds(req.query));
exports.getRefundById     = wrap(async (req) => svc.getRefundById(req.params.id));
exports.getCommissions    = wrap(async (req) => svc.getCommissions(req.query));
exports.getCommissionByPartner = wrap(async () => svc.getCommissionByPartner());
exports.getPartnerPayments= wrap(async () => svc.getPartnerPayments());

exports.approveRefund = wrap(async (req) => {
  return svc.approveRefund(req.params.id, req.user.id);
});

exports.rejectRefund = async (req, res) => {
  try {
    const { ly_do } = req.body;
    if (!ly_do?.trim()) {
      return res.status(400).json({ success: false, message: 'Nhập lý do từ chối' });
    }
    const data = await svc.rejectRefund(req.params.id, req.user.id, ly_do);
    res.json({ success: true, data, message: 'Đã từ chối hoàn tiền' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.confirmCommission = wrap(async (req) => svc.confirmCommission(req.params.id));