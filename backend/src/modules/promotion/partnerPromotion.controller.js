const partnerPromotionService = require('./partnerPromotion.service');
const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac;
};

exports.getHotels = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await partnerPromotionService.getHotels(doiTacId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await partnerPromotionService.list(doiTacId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await partnerPromotionService.create(doiTacId, req.user.id, req.body);
    res.status(201).json({ success: true, data, message: 'Đã tạo khuyến mãi' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const data = await partnerPromotionService.update(doiTacId, id, req.body);
    res.json({ success: true, data, message: 'Đã cập nhật khuyến mãi' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
