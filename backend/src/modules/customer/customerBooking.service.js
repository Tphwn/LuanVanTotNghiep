const prisma = require('../../config/prisma');
const {
  parseDate,
  calcStayPrice,
  getDatesInRange,
  countOverlappingBookings,
} = require('../../utils/bookingHelpers');

const BOOKING_STATUS = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_huy: 'Đã hủy',
  tu_choi: 'Bị từ chối',
  hoan_thanh: 'Hoàn thành',
};

const generateOrderCode = () => {
  const now = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `DH${now}${rand}`;
};

const buildNightDetails = async (maLoaiPhong, giaCoBan, checkIn, checkOut) => {
  const dates = getDatesInRange(checkIn, checkOut);
  const customPrices = await prisma.bang_gia_phong.findMany({
    where: {
      ma_loai_phong: maLoaiPhong,
      ngay: { gte: checkIn, lt: checkOut },
    },
  });

  const priceMap = customPrices.reduce((acc, row) => {
    acc[row.ngay.toISOString().slice(0, 10)] = Number(row.don_gia);
    return acc;
  }, {});

  const base = Number(giaCoBan);
  return dates.map((date) => ({
    ngay: new Date(date),
    don_gia: priceMap[date] ?? base,
    loai_gia: 'co_ban',
  }));
};

const customerBookingService = {
  getMyBookings: async (userId) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) return [];

    const bookings = await prisma.dat_phong.findMany({
      where: { ma_khach_hang: khachHang.ma_khach_hang },
      include: {
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
                dia_diem: { select: { ten_dia_diem: true } },
              },
            },
          },
        },
        thanh_toan: { select: { trang_thai: true } },
      },
      orderBy: { ngay_dat: 'desc' },
    });

    return bookings.map((b) => ({
      ma_dat_phong: b.ma_dat_phong,
      ma_don_hang: b.ma_don_hang,
      ngay_nhan_phong: b.ngay_nhan_phong,
      ngay_tra_phong: b.ngay_tra_phong,
      so_khach: b.so_khach,
      thanh_toan_cuoi: Number(b.thanh_toan_cuoi),
      trang_thai: b.trang_thai,
      trang_thai_label: BOOKING_STATUS[b.trang_thai] || b.trang_thai,
      khach_san: b.loai_phong?.khach_san,
      ten_loai_phong: b.loai_phong?.ten_loai,
    }));
  },

  createBooking: async (userId, data) => {
    const {
      ma_loai_phong,
      ngay_nhan,
      ngay_tra,
      so_khach,
      ten_nguoi_nhan,
      sdt_nguoi_nhan,
      phuong_thuc_tt = 'truc_tuyen',
      ghi_chu,
    } = data;

    if (!ma_loai_phong || !ngay_nhan || !ngay_tra) {
      throw { statusCode: 400, message: 'Thiếu thông tin đặt phòng' };
    }
    if (!ten_nguoi_nhan?.trim() || !sdt_nguoi_nhan?.trim()) {
      throw { statusCode: 400, message: 'Vui lòng nhập họ tên và số điện thoại người nhận phòng' };
    }

    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      throw { statusCode: 400, message: 'Ngày trả phòng phải sau ngày nhận phòng' };
    }
    if (checkIn < today) {
      throw { statusCode: 400, message: 'Ngày nhận phòng không được ở quá khứ' };
    }
    if (guests <= 0) {
      throw { statusCode: 400, message: 'Số khách phải lớn hơn 0' };
    }

    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const room = await prisma.loai_phong.findFirst({
      where: { ma_loai_phong: Number(ma_loai_phong), trang_thai: 'hoat_dong' },
      include: {
        khach_san: { select: { ma_khach_san: true, trang_thai: true } },
      },
    });

    if (!room || room.khach_san.trang_thai !== 'hoat_dong') {
      throw { statusCode: 404, message: 'Loại phòng không khả dụng' };
    }
    if (room.suc_chua < guests) {
      throw { statusCode: 400, message: `Phòng chỉ chứa tối đa ${room.suc_chua} khách` };
    }

    const booked = await countOverlappingBookings(room.ma_loai_phong, checkIn, checkOut);
    if (Number(room.so_luong_mo_ban) - booked <= 0) {
      throw { statusCode: 409, message: 'Phòng đã hết chỗ trong khoảng thời gian này' };
    }

    const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
    const tongTien = pricing.tong_luong_tru;
    const chiTietRows = await buildNightDetails(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);

    const paymentMethod = phuong_thuc_tt === 'tai_khach_san' ? 'Tại khách sạn' : 'Trực tuyến';

    const booking = await prisma.$transaction(async (tx) => {
      return tx.dat_phong.create({
        data: {
          ma_khach_hang: khachHang.ma_khach_hang,
          ma_loai_phong: room.ma_loai_phong,
          ma_don_hang: generateOrderCode(),
          ngay_nhan_phong: checkIn,
          ngay_tra_phong: checkOut,
          so_khach: guests,
          ten_nguoi_nhan: ten_nguoi_nhan.trim(),
          sdt_nguoi_nhan: sdt_nguoi_nhan.trim(),
          tong_tien_goc: tongTien,
          tien_giam: 0,
          thanh_toan_cuoi: tongTien,
          phuong_thuc_tt,
          trang_thai: 'cho_xac_nhan',
          ghi_chu: ghi_chu?.trim() || null,
          chi_tiet_dat_phong: { create: chiTietRows },
          thanh_toan: {
            create: {
              so_tien: tongTien,
              phuong_thuc: paymentMethod,
              trang_thai: 'cho',
            },
          },
        },
        include: {
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ten: true } },
            },
          },
        },
      });
    });

    return {
      ma_dat_phong: booking.ma_dat_phong,
      ma_don_hang: booking.ma_don_hang,
      ngay_nhan_phong: booking.ngay_nhan_phong,
      ngay_tra_phong: booking.ngay_tra_phong,
      so_khach: booking.so_khach,
      thanh_toan_cuoi: Number(booking.thanh_toan_cuoi),
      trang_thai: booking.trang_thai,
      trang_thai_label: BOOKING_STATUS[booking.trang_thai],
      ten_loai_phong: booking.loai_phong?.ten_loai,
      ten_khach_san: booking.loai_phong?.khach_san?.ten,
    };
  },
};

module.exports = customerBookingService;
