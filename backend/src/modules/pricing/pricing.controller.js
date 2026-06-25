const pricingService = require('./pricing.service');
const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: userId },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac;
};

const verifyRoomOwnership = async (doiTacId, roomIds) => {
  const ids = [...new Set(roomIds.map(Number).filter(Boolean))];
  if (!ids.length) return;

  const owned = await prisma.loai_phong.findMany({
    where: {
      ma_loai_phong: { in: ids },
      khach_san: { ma_doi_tac: doiTacId },
    },
    select: { ma_loai_phong: true },
  });

  if (owned.length !== ids.length) {
    throw new Error('Không có quyền cập nhật giá cho một hoặc nhiều loại phòng');
  }
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

// Lịch quản lý giá + kho phòng theo ngày
exports.getManagementCalendar = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });

    const { maLoaiPhong, tuNgay, denNgay } = req.query;
    if (!maLoaiPhong || !tuNgay || !denNgay) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số' });
    }

    await verifyRoomOwnership(doiTacId, [maLoaiPhong]);
    const data = await pricingService.getManagementCalendar(maLoaiPhong, tuNgay, denNgay);
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

    await verifyRoomOwnership(
      doiTacId,
      entries.map((e) => e.ma_loai_phong ?? e.maLoaiPhong)
    );

    const data = await pricingService.savePrices(entries);
    res.json({ success: true, data, message: `Đã lưu ${data.length} bản ghi giá` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa giá đặc biệt (1 ngày)
exports.deletePrice = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });

    const maLoaiPhong = req.body.maLoaiPhong ?? req.body.ma_loai_phong;
    const { ngay } = req.body;

    if (!maLoaiPhong || !ngay) {
      return res.status(400).json({ success: false, message: 'Thiếu ma_loai_phong hoặc ngay' });
    }

    await verifyRoomOwnership(doiTacId, [maLoaiPhong]);
    await pricingService.deletePrice(maLoaiPhong, ngay);
    res.json({ success: true, message: 'Đã xóa giá đặc biệt' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa giá đặc biệt hàng loạt
exports.deletePricesBulk = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cần xóa' });
    }

    await verifyRoomOwnership(
      doiTacId,
      items.map((i) => i.maLoaiPhong ?? i.ma_loai_phong)
    );

    const result = await pricingService.deletePricesBulk(items);
    res.json({ success: true, data: result, message: `Đã xóa ${result.count} bản ghi giá` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
