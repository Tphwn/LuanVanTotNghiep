const service = require('./partnerReview.service');
const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac;
};

exports.getHotels = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await service.getHotels(doiTacId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRoomTypes = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await service.getRoomTypes(doiTacId, req.query.ma_khach_san);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await service.getReviews(doiTacId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respond = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const { phan_hoi_doi_tac } = req.body;
    if (!phan_hoi_doi_tac?.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }
    const data = await service.respond(req.params.id, phan_hoi_doi_tac, doiTacId);
    res.json({ success: true, data, message: 'Đã gửi phản hồi' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
