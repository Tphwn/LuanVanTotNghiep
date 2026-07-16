const prisma = require('../../config/prisma');
const { attachHotelImages } = require('../../utils/images');
const {
  processRefundOnCancel,
  calcRefundFromPolicy,
  DEFAULT_POLICIES,
  wasBookingPaid,
  getRefundStatusLabel,
  extractCancelReason,
} = require('../../utils/refundHelpers');
const {
  parseDate,
  calcStayPrice,
  getDatesInRange,
  countOverlappingBookings,
  autoCompleteExpiredCheckIns,
  isAutoCompletedBooking,
} = require('../../utils/bookingHelpers');
const { assertPromotionApplicable, syncExpiredPromotions } = require('../../utils/promotionRules');

const BOOKING_STATUS = {
  cho_xac_nhan: 'Chờ check-in',
  da_xac_nhan: 'Chờ check-in',
  da_checkin: 'Đã check-in',
  da_huy: 'Đã hủy',
  tu_choi: 'Đã hủy',
  hoan_thanh: 'Hoàn thành',
};

const CANCELLABLE_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];

const REVIEW_STATUS_LABEL = {
  hien_thi: 'Hiển thị',
  an: 'Đã ẩn',
};

const mapCustomerReview = (dg) => {
  if (!dg) return null;
  return {
    ma_danh_gia: dg.ma_danh_gia,
    so_sao: dg.so_sao,
    diem_sach_se: dg.diem_sach_se,
    diem_dich_vu: dg.diem_dich_vu,
    diem_vi_tri: dg.diem_vi_tri,
    diem_tien_nghi: dg.diem_tien_nghi,
    noi_dung: dg.noi_dung,
    trang_thai: dg.trang_thai,
    trang_thai_label: REVIEW_STATUS_LABEL[dg.trang_thai] || dg.trang_thai,
    ly_do_an: dg.trang_thai === 'an' ? (dg.ly_do_an || null) : null,
    ngay_danh_gia: dg.ngay_danh_gia,
    phan_hoi_doi_tac: (!dg.phan_hoi_bi_an && dg.phan_hoi_doi_tac) ? dg.phan_hoi_doi_tac : null,
    ngay_phan_hoi: dg.ngay_phan_hoi || null,
  };
};

const validateStarScore = (value, label) => {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw { statusCode: 400, message: `${label} phải từ 1 đến 5 sao` };
  }
  return score;
};

const canCustomerReviewBooking = (booking) => {
  if (!booking) {
    return { ok: false, message: 'Không tìm thấy đơn đặt phòng' };
  }
  if (booking.trang_thai === 'da_huy' || booking.trang_thai === 'tu_choi') {
    return { ok: false, message: 'Không thể đánh giá đơn đã hủy' };
  }
  if (booking.trang_thai !== 'hoan_thanh') {
    return { ok: false, message: 'Chỉ đánh giá được sau khi đơn hoàn thành (đã check-out)' };
  }
  if (booking.danh_gia) {
    return { ok: false, message: 'Đơn này đã được đánh giá' };
  }
  if (isAutoCompletedBooking(booking)) {
    return { ok: false, message: 'Không thể đánh giá đơn chưa check-in và check-out' };
  }
  return { ok: true };
};

const mapCustomerCancelReason = (booking) => {
  if (!['da_huy', 'tu_choi'].includes(booking?.trang_thai)) return null;
  return booking.hoan_tien?.ly_do || extractCancelReason(booking.ghi_chu);
};

const mapCustomerStatusLabel = (booking) => {
  if (booking.ghi_chu?.trim().startsWith('[Admin hủy]')) return 'Bị hủy bởi admin';
  return BOOKING_STATUS[booking.trang_thai] || booking.trang_thai;
};

const mapCustomerRefundSummary = (booking) => {
  if (!['da_huy', 'tu_choi'].includes(booking?.trang_thai)) return null;

  const adminCancelled = Boolean(booking.ghi_chu?.trim().startsWith('[Admin hủy]'));
  const paid = wasBookingPaid(booking);
  const soTienHoan = booking.hoan_tien ? Number(booking.hoan_tien.so_tien_hoan) : 0;
  const refundLabel = booking.hoan_tien
    ? getRefundStatusLabel(booking.hoan_tien.trang_thai)
    : null;

  if (adminCancelled) {
    if (paid && soTienHoan > 0) {
      let text = `Bạn được hoàn 100% số tiền đã thanh toán (${soTienHoan.toLocaleString('vi-VN')}đ).`;
    
      return text;
    }
    return 'Bạn chưa thanh toán online nên không phát sinh hoàn tiền.';
  }

  if (paid && soTienHoan > 0) {
    let text = `Theo chính sách hủy, bạn được hoàn ${soTienHoan.toLocaleString('vi-VN')}đ.`;
    if (refundLabel) text += ` Trạng thái hoàn tiền: ${refundLabel}.`;
    return text;
  }
  if (paid) {
    return 'Theo chính sách hủy, đơn này không được hoàn tiền.';
  }
  return 'Bạn chưa thanh toán online nên không phát sinh hoàn tiền.';
};

const mapCustomerBooking = (b) => ({
  ma_dat_phong: b.ma_dat_phong,
  ma_don_hang: b.ma_don_hang,
  ngay_nhan_phong: b.ngay_nhan_phong,
  ngay_tra_phong: b.ngay_tra_phong,
  so_khach: b.so_khach,
  thanh_toan_cuoi: Number(b.thanh_toan_cuoi),
  trang_thai: b.trang_thai,
  trang_thai_label: mapCustomerStatusLabel(b),
  ly_do_huy: mapCustomerCancelReason(b),
  huy_boi_admin: Boolean(b.ghi_chu?.trim().startsWith('[Admin hủy]')),
  tom_tat_hoan_tien: mapCustomerRefundSummary(b),
  co_the_danh_gia: canCustomerReviewBooking(b).ok,
  da_danh_gia: !!b.danh_gia,
  danh_gia: mapCustomerReview(b.danh_gia),
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
const toDateStr =(d) => {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}
const getLoaiGiuongLabel = (soGiuong, sucChua) => {
  const n = Number(soGiuong) || 1;
  const sc = Number(sucChua) || 1;
  if (n === 1) {
    if (sc >= 4) return '1 giường đôi lớn + sofa';
    if (sc >= 2) return '1 giường đôi';
    return '1 giường đơn';
  }
  return `${n} giường đơn`;
};
const mapPaymentStatus = (ttStatus, bookingStatus) => {
  if (ttStatus === 'thanh_cong') return 'da_thanh_toan';
  if (ttStatus === 'that_bai') return 'that_bai';
  if (bookingStatus === 'da_huy' || bookingStatus === 'tu_choi') return 'da_huy';
  return 'cho_thanh_toan';
};
const mapPaymentMethod = (phuongThucTt) => (
  phuongThucTt === 'truc_tuyen' ? 'online' : 'tai_khach_san'
);
// Lấy ảnh đại diện KS từ mảng hinh_anh (sau attachHotelImages)
const pickHotelAvatar = (hinhAnh = []) => {
  const main = hinhAnh.find((i) => i.la_anh_chinh) || hinhAnh[0];
  return main?.url || null;
};
const mapCustomerBookingDetail = (booking) => {
  const hotel = booking.loai_phong?.khach_san;
  const room = booking.loai_phong;
  const nights = booking.chi_tiet_dat_phong || [];
  const soDem = nights.length || 0;
  // Giá mỗi đêm: trung bình (hoặc đêm đầu nếu bạn thích)
  const giaMoiDem = soDem > 0
    ? Math.round(nights.reduce((s, n) => s + Number(n.don_gia), 0) / soDem)
    : Number(booking.tong_tien_goc);
  return {
    ma_dat_phong: booking.ma_dat_phong,
    ma_don: booking.ma_don_hang,
    trang_thai: booking.trang_thai,
    trang_thai_label: mapCustomerStatusLabel(booking),
    ly_do_huy: mapCustomerCancelReason(booking),
    huy_boi_admin: Boolean(booking.ghi_chu?.trim().startsWith('[Admin hủy]')),
    tom_tat_hoan_tien: mapCustomerRefundSummary(booking),
    co_the_huy: CANCELLABLE_STATUS.includes(booking.trang_thai),
    co_the_danh_gia: canCustomerReviewBooking(booking).ok,
    da_danh_gia: !!booking.danh_gia,
    danh_gia: mapCustomerReview(booking.danh_gia),
    ngay_dat: booking.ngay_dat,
    khach_san: {
      ma_khach_san: hotel?.ma_khach_san,
      ten: hotel?.ten,
      dia_chi: hotel?.dia_chi,
      anh_dai_dien: pickHotelAvatar(hotel?.hinh_anh),
    },
    loai_phong: {
      ma_loai_phong: room?.ma_loai_phong,
      ten_loai: room?.ten_loai,
      suc_chua: room?.suc_chua,
      loai_giuong: getLoaiGiuongLabel(room?.so_giuong, room?.suc_chua),
      dien_tich: room?.dien_tich != null ? Number(room.dien_tich) : null,
    },
    luu_tru: {
      ngay_nhan: toDateStr(booking.ngay_nhan_phong),
      ngay_tra: toDateStr(booking.ngay_tra_phong),
      so_dem: soDem,
      so_phong: 1,              // chưa lưu DB — mặc định 1
      so_nguoi_lon: booking.so_khach,
      so_tre_em: 0,             // chưa lưu DB — mặc định 0
    },
    nguoi_dat: {
      ho_ten: booking.ten_nguoi_nhan,
      so_dien_thoai: booking.sdt_nguoi_nhan,
      email: booking.khach_hang?.nguoi_dung?.email || null,
      ghi_chu: booking.ghi_chu,
    },
    thanh_toan: {
      gia_moi_dem: giaMoiDem,
      tam_tinh: Number(booking.tong_tien_goc),
      giam_gia: Number(booking.tien_giam),
      tong_tien: Number(booking.thanh_toan_cuoi),
      trang_thai: mapPaymentStatus(booking.thanh_toan?.trang_thai, booking.trang_thai),
      phuong_thuc: mapPaymentMethod(booking.phuong_thuc_tt),
      ma_giao_dich: booking.thanh_toan?.ma_giao_dich || null,
    },
    hoan_tien: booking.hoan_tien
      ? {
        so_tien_hoan: Number(booking.hoan_tien.so_tien_hoan),
        trang_thai: booking.hoan_tien.trang_thai,
        trang_thai_label: getRefundStatusLabel(booking.hoan_tien.trang_thai),
      }
      : null,
    // Tuỳ chọn: chi tiết từng đêm cho UI breakdown
    chi_tiet_dem: nights.map((n) => ({
      ngay: toDateStr(n.ngay),
      don_gia: Number(n.don_gia),
      loai_gia: n.loai_gia,
    })),
  };
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
            ly_do: true,
          },
        },
        danh_gia: {
          select: {
            ma_danh_gia: true,
            so_sao: true,
            diem_sach_se: true,
            diem_dich_vu: true,
            diem_vi_tri: true,
            diem_tien_nghi: true,
            noi_dung: true,
            trang_thai: true,
            ngay_danh_gia: true,
            phan_hoi_doi_tac: true,
            ngay_phan_hoi: true,
          },
        },
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
          ? `Theo chính sách hủy, bạn được hoàn ${calc.phan_tram_hoan}% (tương đương ${calc.so_tien_hoan.toLocaleString('vi-VN')}đ).`
          : 'Theo chính sách hủy, bạn không được hoàn tiền.')
        : 'Bạn thanh toán tại khách sạn nên không phát sinh hoàn tiền.',
    };
  },
  getBookingById: async (userId, maDatPhong) => {
    const id = parseInt(maDatPhong, 10);
    if (Number.isNaN(id)) {
      throw { statusCode: 400, message: 'ID không hợp lệ' };
    }
  
    // 1) Tìm hồ sơ khách từ JWT
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
      select: {
        ma_khach_hang: true,
        nguoi_dung: { select: { email: true } },
      },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    await autoCompleteExpiredCheckIns({
      ma_dat_phong: id,
      ma_khach_hang: khachHang.ma_khach_hang,
    });

    // 2) Query đơn — BẮT BUỘC lọc ma_khach_hang (chỉ xem đơn của mình)
    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: id,
        ma_khach_hang: khachHang.ma_khach_hang,
      },
      include: {
        khach_hang: {
          select: {
            nguoi_dung: { select: { email: true } },
          },
        },
        loai_phong: {
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            suc_chua: true,
            dien_tich: true,
            so_giuong: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
              },
            },
          },
        },
        chi_tiet_dat_phong: { orderBy: { ngay: 'asc' } },
        thanh_toan: true,
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
          },
        },
        danh_gia: {
          select: {
            ma_danh_gia: true,
            so_sao: true,
            diem_sach_se: true,
            diem_dich_vu: true,
            diem_vi_tri: true,
            diem_tien_nghi: true,
            noi_dung: true,
            trang_thai: true,
            ngay_danh_gia: true,
            phan_hoi_doi_tac: true,
            ngay_phan_hoi: true,
          },
        },
      },
    });
  
    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
  
    // 3) Gắn ảnh khách sạn (bảng hinh_anh)
    const hotel = booking.loai_phong?.khach_san;
    if (hotel?.ma_khach_san) {
      const [withImg] = await attachHotelImages([hotel]);
      booking.loai_phong.khach_san = withImg;
    }
  
    // 4) Map sang JSON FE
    return mapCustomerBookingDetail(booking);
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
      ma_code,
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

    let promo = null;
    let tienGiam = 0;
    if (ma_code && String(ma_code).trim()) {
      await syncExpiredPromotions(prisma);
      promo = await prisma.khuyen_mai.findUnique({
        where: { ma_code: String(ma_code).trim().toUpperCase() },
      });
      try {
        tienGiam = assertPromotionApplicable(promo, {
          maKhachSan: room.khach_san.ma_khach_san,
          tongTien,
        });
      } catch (err) {
        throw { statusCode: err.statusCode || 400, message: err.message };
      }
    }

    const paymentMethod = phuong_thuc_tt === 'tai_khach_san' ? 'Tại khách sạn' : 'Trực tuyến';
    const isOnline = phuong_thuc_tt === 'truc_tuyen';
    const now = new Date();

    const booking = await prisma.$transaction(async (tx) => {
      if (promo) {
        const freshPromo = await tx.khuyen_mai.findUnique({
          where: { ma_khuyen_mai: promo.ma_khuyen_mai },
        });
        tienGiam = assertPromotionApplicable(freshPromo, {
          maKhachSan: room.khach_san.ma_khach_san,
          tongTien,
        });
      }

      const finalThanhToan = Math.max(tongTien - tienGiam, 0);

      const created = await tx.dat_phong.create({
        data: {
          ma_khach_hang: khachHang.ma_khach_hang,
          ma_loai_phong: room.ma_loai_phong,
          ma_khuyen_mai: promo ? promo.ma_khuyen_mai : null,
          ma_don_hang: generateOrderCode(),
          ngay_nhan_phong: checkIn,
          ngay_tra_phong: checkOut,
          so_khach: guests,
          ten_nguoi_nhan: ten_nguoi_nhan.trim(),
          sdt_nguoi_nhan: sdt_nguoi_nhan.trim(),
          tong_tien_goc: tongTien,
          tien_giam: tienGiam,
          thanh_toan_cuoi: finalThanhToan,
          phuong_thuc_tt,
          trang_thai: 'da_xac_nhan',
          ghi_chu: ghi_chu?.trim() || null,
          chi_tiet_dat_phong: { create: chiTietRows },
          thanh_toan: {
            create: {
              so_tien: finalThanhToan,
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

      if (promo) {
        await tx.khuyen_mai.update({
          where: { ma_khuyen_mai: promo.ma_khuyen_mai },
          data: { so_luot_da_dung: { increment: 1 } },
        });
      }

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
      tong_tien_goc: Number(booking.tong_tien_goc),
      tien_giam: Number(booking.tien_giam),
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
    const id = parseInt(maDatPhong, 10);
    if (Number.isNaN(id)) {
      throw { statusCode: 400, message: 'ID không hợp lệ' };
    }
    const { so_sao, noi_dung, diem_sach_se, diem_dich_vu, diem_vi_tri, diem_tien_nghi } = payload;
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }
    await autoCompleteExpiredCheckIns({
      ma_dat_phong: id,
      ma_khach_hang: khachHang.ma_khach_hang,
    });
    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: id,
        ma_khach_hang: khachHang.ma_khach_hang,
      },
      include: { danh_gia: true },
    });
    const eligibility = canCustomerReviewBooking(booking);
    if (!eligibility.ok) {
      throw { statusCode: 400, message: eligibility.message };
    }
    const review = await prisma.danh_gia.create({
      data: {
        ma_dat_phong: booking.ma_dat_phong,
        ma_khach_hang: khachHang.ma_khach_hang,
        so_sao: validateStarScore(so_sao, 'Điểm tổng thể'),
        diem_sach_se: validateStarScore(diem_sach_se, 'Sạch sẽ'),
        diem_dich_vu: validateStarScore(diem_dich_vu, 'Dịch vụ'),
        diem_vi_tri: validateStarScore(diem_vi_tri, 'Vị trí'),
        diem_tien_nghi: validateStarScore(diem_tien_nghi, 'Tiện nghi'),
        noi_dung: noi_dung?.trim() || null,
        trang_thai: 'hien_thi',
      },
    });
    return mapCustomerReview(review);
  },

  getReviewByBookingId: async (userId, maDatPhong) => {
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
        danh_gia: true,
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (!booking.danh_gia) {
      throw { statusCode: 404, message: 'Đơn này chưa có đánh giá' };
    }

    return mapCustomerReview(booking.danh_gia);
  },
};

module.exports = customerBookingService;
