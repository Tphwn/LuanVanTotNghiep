const publicHotelService = require('./publicHotel.service');
const { success, error } = require('../../utils/response');
const HTTP = require('../../constants/httpStatus');

const getLocations = async (req, res, next) => {
  try {
    const data = await publicHotelService.getLocations();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPopularDestinations = async (req, res, next) => {
  try {
    const data = await publicHotelService.getPopularDestinations();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const listHotels = async (req, res, next) => {
  try {
    const { ma_dia_diem } = req.query;
    const data = await publicHotelService.listHotels({ ma_dia_diem });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const searchHotels = async (req, res, next) => {
  try {
    const { ma_dia_diem, ngay_nhan, ngay_tra, so_khach } = req.query;

    if (ngay_nhan && ngay_tra) {
      const checkIn = new Date(ngay_nhan);
      const checkOut = new Date(ngay_tra);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkOut <= checkIn) {
        return error(res, 'Ngày trả phòng phải sau ngày nhận phòng', HTTP.BAD_REQUEST);
      }
      if (checkIn < today) {
        return error(res, 'Ngày nhận phòng không được ở quá khứ', HTTP.BAD_REQUEST);
      }
    }

    const data = await publicHotelService.searchHotels({
      ma_dia_diem,
      ngay_nhan,
      ngay_tra,
      so_khach,
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getHotelById = async (req, res, next) => {
  try {
    const { ngay_nhan, ngay_tra, so_khach } = req.query;
    const hotel = await publicHotelService.getHotelById(req.params.id, {
      ngay_nhan,
      ngay_tra,
      so_khach,
    });
    if (!hotel) return error(res, 'Khách sạn không tồn tại hoặc không khả dụng', HTTP.NOT_FOUND);
    return success(res, hotel);
  } catch (err) {
    next(err);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const { ngay_nhan, ngay_tra, so_khach } = req.query;
    const room = await publicHotelService.getRoomById(req.params.hotelId, req.params.roomId, {
      ngay_nhan,
      ngay_tra,
      so_khach,
    });
    if (!room) return error(res, 'Loại phòng không tồn tại hoặc không khả dụng', HTTP.NOT_FOUND);
    return success(res, room);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLocations, getPopularDestinations, listHotels, searchHotels, getHotelById, getRoomById };
