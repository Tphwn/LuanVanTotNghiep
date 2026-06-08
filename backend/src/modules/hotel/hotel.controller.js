const hotelService = require('./hotel.service');
const prisma = require('../../config/prisma');

// Helper để lấy ID đối tác từ request.
// Hàm này cũng tự động gửi phản hồi lỗi nếu người dùng không hợp lệ.
const getPartnerIdFromRequest = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Yêu cầu xác thực không hợp lệ.' });
    return null;
  }

  const partner = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: userId },
    select: { ma_doi_tac: true },
  });

  if (!partner) {
    res.status(403).json({ success: false, message: 'Tài khoản không phải là đối tác.' });
    return null;
  }

  return partner.ma_doi_tac;
};

exports.getMyHotels = async (req, res) => {
  try {
    const doiTacId = await getPartnerIdFromRequest(req, res);
    if (!doiTacId) return; // Phản hồi lỗi đã được gửi bởi helper

    const data = await hotelService.getMyHotels(doiTacId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const doiTacId = await getPartnerIdFromRequest(req, res);
    if (!doiTacId) return;

    const hotelId = Number(req.params.id);
    const data = await hotelService.getById(hotelId);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn.' });
    }

    // Lỗ hổng bảo mật: Kiểm tra khách sạn có thuộc về đối tác không
    if (data.ma_doi_tac !== doiTacId) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập khách sạn này.' });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const doiTacId = await getPartnerIdFromRequest(req, res);
    if (!doiTacId) return;

    const data = await hotelService.create(req.body, doiTacId);
    res.status(201).json({ success: true, data, message: 'Tạo khách sạn thành công, chờ admin duyệt' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const doiTacId = await getPartnerIdFromRequest(req, res);
    if (!doiTacId) return;

    const hotelId = Number(req.params.id);
    const data = await hotelService.update(hotelId, req.body, doiTacId);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDiaDiem = async (req, res) => {
  try {
    const data = await hotelService.getDiaDiem();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAmenitiesForHotel = async (req, res) => {
  try {
    const data = await hotelService.getAmenitiesForHotel();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};