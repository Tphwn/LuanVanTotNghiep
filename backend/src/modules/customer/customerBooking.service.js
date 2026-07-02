const prisma = require('../../config/prisma');
const {
  processRefundOnCancel,
  calcRefundFromPolicy,
  DEFAULT_POLICIES,
  wasBookingPaid,
  getRefundStatusLabel,
} = require('../../utils/refundHelpers');
const {
  parseDate,
  calcStayPrice,
  getDatesInRange,
  countOverlappingBookings,
  autoCompleteExpiredCheckIns,
  isAutoCompletedBooking,
} = require('../../utils/bookingHelpers');

const BOOKING_STATUS = {
  cho_xac_nhan: 'Chờ check-in',
  da_xac_nhan: 'Chờ check-in',
  da_checkin: 'Đã check-in',
  da_huy: 'Đã hủy',
  tu_choi: 'Đã hủy',
  hoan_thanh: 'Hoàn thành',
};

const CANCELLABLE_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];

const mapCustomerBooking = (b) => ({
  ma_dat_phong: b.ma_dat_phong,
  ma_don_hang: b.ma_don_hang,
  ngay_nhan_phong: b.ngay_nhan_phong,
  ngay_tra_phong: b.ngay_tra_phong,
  so_khach: b.so_khach,
  thanh_toan_cuoi: Number(b.thanh_toan_cuoi),
  trang_thai: b.trang_thai,
  trang_thai_label: BOOKING_STATUS[b.trang_thai] || b.trang_thai,
  co_the_danh_gia: b.trang_thai === 'hoan_thanh' && !b.danh_gia && !isAutoCompletedBooking(b),
  co_the_huy: CANCELLABLE_STATUS.includes(b.trang_thai),
  khach_san: b.loai_phong?.khach_san,
  ten_loai_phong: b.loai_phong?.ten_loai,
  hoan_tien: b.hoan_tien
    ? {
      ma_hoan_tien: b.hoan_tien.ma_hoan_tien,
      trang_thai: b.hoan_tien.trang_thai,
      so_tien_hoan: Number(b.hoan_tien.so_tien_hoan),
      trang_thai_label: getRefundStatusLabel(b.hoan_tien.trang_thai),
    }
    : null,
});

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

    await autoCompleteExpiredCheckIns({ ma_khach_hang: khachHang.ma_khach_hang });

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
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
          },
        },
        danh_gia: { select: { ma_danh_gia: true } },
      },
      orderBy: { ngay_dat: 'desc' },
    });

    return bookings.map(mapCustomerBooking);
  },

  getCancelPreview: async (userId, maDatPhong) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: khachHang.ma_khach_hang,
      },
      include: {
        thanh_toan: true,
        loai_phong: {
          include: {
            khach_san: {
              include: {
                chinh_sach_huy: {
                  where: { trang_thai: 'hoat_dong' },
                  orderBy: { so_ngay_truoc: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (!CANCELLABLE_STATUS.includes(booking.trang_thai)) {
      throw { statusCode: 400, message: 'Chỉ hủy được đơn chưa check-in' };
    }

    const policies = booking.loai_phong?.khach_san?.chinh_sach_huy || [];
    const cancelDate = new Date();
    const calc = calcRefundFromPolicy(
      policies,
      booking.ngay_nhan_phong,
      cancelDate,
      booking.thanh_toan_cuoi,
    );
    const paid = wasBookingPaid(booking);
    const activePolicies = (policies.length ? policies : DEFAULT_POLICIES)
      .filter((p) => p.trang_thai == null || p.trang_thai === 'hoat_dong')
      .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc);

    return {
      ma_dat_phong: booking.ma_dat_phong,
      ma_don_hang: booking.ma_don_hang,
      ten_khach_san: booking.loai_phong?.khach_san?.ten,
      thanh_toan_cuoi: Number(booking.thanh_toan_cuoi),
      da_thanh_toan_online: paid,
      so_ngay_con_lai: calc.so_ngay_con_lai,
      chinh_sach: activePolicies.map((p) => ({
        so_ngay_truoc: Number(p.so_ngay_truoc),
        phan_tram_hoan: Number(p.phan_tram_hoan),
      })),
      ap_dung: {
        so_ngay_truoc: calc.so_ngay_truoc_ap_dung,
        phan_tram_hoan: calc.phan_tram_hoan,
        so_tien_hoan: calc.so_tien_hoan,
      },
      tom_tat: paid
        ? (calc.so_tien_hoan > 0
          ? `Theo chính sách hủy, bạn được hoàn ${calc.phan_tram_hoan}% (tương đương ${calc.so_tien_hoan.toLocaleString('vi-VN')}đ). Sau khi xác nhận, yêu cầu hoàn tiền sẽ ở trạng thái "Chờ xử lý".`
          : 'Theo chính sách hủy, bạn không được hoàn tiền. Yêu cầu sẽ ở trạng thái "Chờ xử lý" để admin xác nhận.')
        : 'Bạn thanh toán tại khách sạn nên không phát sinh hoàn tiền.',
    };
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
    const isOnline = phuong_thuc_tt === 'truc_tuyen';
    const now = new Date();

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.dat_phong.create({
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
          trang_thai: 'da_xac_nhan',
          ghi_chu: ghi_chu?.trim() || null,
          chi_tiet_dat_phong: { create: chiTietRows },
          thanh_toan: {
            create: {
              so_tien: tongTien,
              phuong_thuc: paymentMethod,
              cong_thanh_toan: isOnline ? 'MoMo (Ví điện tử)' : 'Tại khách sạn',
              trang_thai: isOnline ? 'thanh_cong' : 'cho',
              thoi_gian: now,
              ngay_cap_nhat: isOnline ? new Date(now.getTime() + 120000) : null,
              ma_tham_chieu: isOnline ? String(3145689000 + Math.floor(Math.random() * 999999)) : null,
            },
          },
        },
        include: {
          thanh_toan: true,
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ten: true } },
            },
          },
        },
      });

      if (created.thanh_toan) {
        await tx.thanh_toan.update({
          where: { ma_thanh_toan: created.thanh_toan.ma_thanh_toan },
          data: {
            ma_giao_dich: `TXN-${String(created.thanh_toan.ma_thanh_toan).padStart(6, '0')}`,
          },
        });
      }

      return created;
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

  cancelBooking: async (userId, maDatPhong, lyDo) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: khachHang.ma_khach_hang,
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (!CANCELLABLE_STATUS.includes(booking.trang_thai)) {
      throw { statusCode: 400, message: 'Chỉ hủy được đơn chưa check-in' };
    }

    const reason = lyDo?.trim() || 'Khách hàng hủy đơn';

    await prisma.$transaction(async (tx) => {
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(maDatPhong) },
        data: { trang_thai: 'da_huy', ghi_chu: reason },
      });
      await processRefundOnCancel(tx, maDatPhong, reason);
    });

    const bookings = await customerBookingService.getMyBookings(userId);
    const updated = bookings.find((b) => b.ma_dat_phong === Number(maDatPhong));
    if (!updated) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    return updated;
  },

  createReview: async (userId, maDatPhong, payload) => {
    const { so_sao, noi_dung, diem_sach_se, diem_dich_vu, diem_vi_tri, diem_tien_nghi } = payload;
    const rating = Number(so_sao);

    if (!rating || rating < 1 || rating > 5) {
      throw { statusCode: 400, message: 'Điểm đánh giá phải từ 1 đến 5 sao' };
    }

    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: khachHang.ma_khach_hang,
      },
      include: { danh_gia: true },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (booking.trang_thai !== 'hoan_thanh') {
      throw { statusCode: 400, message: 'Chỉ đánh giá được sau khi đơn hoàn thành' };
    }
    if (booking.danh_gia) {
      throw { statusCode: 400, message: 'Đơn này đã được đánh giá' };
    }
    if (isAutoCompletedBooking(booking)) {
      throw { statusCode: 400, message: 'Không thể đánh giá đơn chưa check-in' };
    }

    return prisma.danh_gia.create({
      data: {
        ma_dat_phong: booking.ma_dat_phong,
        ma_khach_hang: khachHang.ma_khach_hang,
        so_sao: rating,
        noi_dung: noi_dung?.trim() || null,
        diem_sach_se: diem_sach_se != null ? Number(diem_sach_se) : null,
        diem_dich_vu: diem_dich_vu != null ? Number(diem_dich_vu) : null,
        diem_vi_tri: diem_vi_tri != null ? Number(diem_vi_tri) : null,
        diem_tien_nghi: diem_tien_nghi != null ? Number(diem_tien_nghi) : null,
        trang_thai: 'cho_duyet',
      },
    });
  },
};

module.exports = customerBookingService;
