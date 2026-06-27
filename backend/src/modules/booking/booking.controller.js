const bookingService = require('./booking.service');
const prisma = require('../../config/prisma');

// Helper lấy doiTacId
const getUserId = (user) => Number(user?.id || user?.ma_nguoi_dung);

const getDoiTacId = async (user) => {
  const userId = getUserId(user);
  if (!userId) return null;
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: userId },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac ?? null;
};

exports.getByPartner = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await bookingService.getByPartner(doiTacId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const data = await bookingService.getDetailById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await bookingService.confirm(req.params.id, doiTacId);
    res.json({ success: true, data, message: 'Đã xác nhận đơn' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await bookingService.checkIn(req.params.id, doiTacId);
    res.json({ success: true, data, message: 'Đã xác nhận check-in' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await bookingService.checkOut(req.params.id, doiTacId);
    res.json({ success: true, data, message: 'Đã xác nhận check-out, đơn hoàn thành' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await bookingService.reject(req.params.id, doiTacId, req.body.ly_do);
    res.json({ success: true, data, message: 'Đã từ chối đơn' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};