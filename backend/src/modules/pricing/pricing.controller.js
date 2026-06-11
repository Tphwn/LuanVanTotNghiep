const pricingService = require('./pricing.service');
const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: userId },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac;
};

// Lấy ds KS + loại phòng của đối tác
exports.getMyHotels = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await pricingService.getMyHotels(doiTacId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy lịch giá của 1 loại phòng
exports.getCalendar = async (req, res) => {
  try {
    const { maLoaiPhong, tuNgay, denNgay } = req.query;
    if (!maLoaiPhong || !tuNgay || !denNgay) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số' });
    }
    const data = await pricingService.getPriceCalendar(maLoaiPhong, tuNgay, denNgay);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lưu giá hàng loạt
exports.savePrices = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu giá' });
    }
    const data = await pricingService.savePrices(entries);
    res.json({ success: true, data, message: `Đã lưu ${data.length} bản ghi giá` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa giá đặc biệt
exports.deletePrice = async (req, res) => {
  try {
    const { maLoaiPhong, ngay } = req.body;
    await pricingService.deletePrice(maLoaiPhong, ngay);
    res.json({ success: true, message: 'Đã xóa giá đặc biệt' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};