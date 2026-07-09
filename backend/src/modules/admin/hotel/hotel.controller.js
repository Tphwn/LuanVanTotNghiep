const hotelService = require('../../hotel/hotel.service');

const getHotels = async (req, res, next) => {
  try {
    const hotels = await hotelService.getAllForAdmin();
    res.json({ success: true, data: hotels });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const hotel = await hotelService.getDetailForAdmin(Number(req.params.id));
    if (!hotel) return res.status(404).json({ success: false, message: 'Khách sạn không tồn tại' });
    res.json({ success: true, data: hotel });
  } catch (error) { next(error); }
};

const approveHotel = async (req, res, next) => {
  try {
    const hotel = await hotelService.approveHotel(req.params.id, req.user?.id);
    res.json({ success: true, data: hotel, message: 'Khách sạn đã được duyệt' });
  } catch (error) {
    next(error);
  }
};

const rejectHotel = async (req, res, next) => {
  try {
    const { lyDo } = req.body;
    const hotel = await hotelService.rejectHotel(req.params.id, req.user?.id, lyDo);
    res.json({ success: true, data: hotel, message: 'Khách sạn đã bị từ chối' });
  } catch (error) {
    next(error);
  }
};

const requestInfoHotel = async (req, res, next) => {
  try {
    const { ghiChu } = req.body;
    const hotel = await hotelService.requestInfoHotel(req.params.id, req.user?.id, ghiChu);
    res.json({ success: true, data: hotel, message: 'Yêu cầu bổ sung thông tin đã được gửi' });
  } catch (error) {
    next(error);
  }
};

const lockHotel = async (req, res, next) => {
  try {
    const { ly_do_khoa: lyDoKhoa } = req.body;
    const hotel = await hotelService.lockHotel(req.params.id, lyDoKhoa);
    res.json({ success: true, data: hotel, message: 'Khách sạn đã bị khóa' });
  } catch (error) {
    next(error);
  }
};

const unlockHotel = async (req, res, next) => {
  try {
    const hotel = await hotelService.unlockHotel(req.params.id);
    res.json({ success: true, data: hotel, message: 'Khách sạn đã được mở khóa' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getById,
  approveHotel,
  rejectHotel,
  requestInfoHotel,
  lockHotel,
  unlockHotel,
};
