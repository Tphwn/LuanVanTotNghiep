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
  countOverlappingBookings,
  autoCompleteExpiredCheckIns,
  isAutoCompletedBooking,
} = require('../../utils/bookingHelpers');
const {
  assertPromotionApplicable,
  assertCustomerHasNotUsedPromotion,
  syncExpiredPromotions,
  decrementPromotionUsage,
  isCustomerFirstBooking,
  findActiveFirstBookingPromo,
} = require('../../utils/promotionRules');
const {
  applyPromoOnBooking,
  removePromoOnBooking,
  listEligiblePromotionsForBooking,
} = require('../../utils/bookingPromo');
const {
  PAY_HOLD_MS,
  purgeUnpaidBooking,
  expireUnpaidOnlineHolds,
} = require('../../utils/unpaidBookingCleanup');
const { validateEmail, validatePhone } = require('../../utils/authValidation');
const { signGuestPayToken, verifyGuestPayToken } = require('../../utils/jwt');
const { buildStayInvoice } = require('../../utils/stayPricing');
const { calcFinalWithVat } = require('../../utils/stayPricing');
const { getHotelVatRate } = require('../../utils/bookingPromo');
const { buildPaymentUrl, verifyReturn } = require('../../utils/vnpay');

const BOOKING_STATUS = {
  cho_xac_nhan: 'Chờ check-in',
  da_xac_nhan: 'Chờ check-in',
  da_checkin: 'Đã check-in',
  da_huy: 'Đã hủy',
  tu_choi: 'Đã hủy',
  hoan_thanh: 'Hoàn thành',
};

const CANCELLABLE_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];
const PAY_TIMEOUT_MARKER = '[Hết hạn thanh toán]';

const REVIEW_STATUS_LABEL = {
  hien_thi: 'Hiển thị',
  an: 'Đã ẩn',
};

const isPaymentTimeoutBooking = (booking) => (
  Boolean(booking?.ghi_chu?.trim().startsWith(PAY_TIMEOUT_MARKER))
);

const isUnpaidOnlineHold = (booking) => (
  booking?.phuong_thuc_tt === 'truc_tuyen'
  && ['cho', 'that_bai'].includes(booking?.thanh_toan?.trang_thai)
  && CANCELLABLE_STATUS.includes(booking?.trang_thai)
);

const getPayDeadline = (booking) => {
  const created = booking?.ngay_dat ? new Date(booking.ngay_dat).getTime() : NaN;
  if (Number.isNaN(created)) return null;
  return new Date(created + PAY_HOLD_MS);
};

const canPayOnline = (booking) => {
  if (!isUnpaidOnlineHold(booking)) return false;
  const deadline = getPayDeadline(booking);
  if (!deadline) return false;
  return Date.now() < deadline.getTime();
};

const tryAutoApplyFirstBookingPromo = async ({
  maKhachHang,
  maDatPhong,
  maKhachSan,
  tongTienGoc,
  thanhToanId = null,
}) => {
  const isFirst = await isCustomerFirstBooking(prisma, maKhachHang, maDatPhong);
  if (!isFirst) return false;

  const promo = await findActiveFirstBookingPromo(prisma);
  if (!promo) return false;

  let discount;
  try {
    discount = assertPromotionApplicable(promo, {
      maKhachSan,
      tongTien: tongTienGoc,
      isFirstBooking: true,
    });
    await assertCustomerHasNotUsedPromotion(prisma, {
      maKhachHang,
      maKhuyenMai: promo.ma_khuyen_mai,
      excludeMaDatPhong: maDatPhong,
    });
  } catch {
    return false;
  }

  const vatRate = await getHotelVatRate(maKhachSan);
  const { thanh_toan_cuoi: finalAmount } = calcFinalWithVat(tongTienGoc, discount, vatRate);
  await prisma.$transaction(async (tx) => {
    await tx.dat_phong.update({
      where: { ma_dat_phong: Number(maDatPhong) },
      data: {
        ma_khuyen_mai: promo.ma_khuyen_mai,
        tien_giam: discount,
        thanh_toan_cuoi: finalAmount,
      },
    });
    if (thanhToanId) {
      await tx.thanh_toan.update({
        where: { ma_thanh_toan: Number(thanhToanId) },
        data: { so_tien: finalAmount },
      });
    }
    await tx.khuyen_mai.update({
      where: { ma_khuyen_mai: promo.ma_khuyen_mai },
      data: { so_luot_da_dung: { increment: 1 } },
    });
  });
  return true;
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
  if (canPayOnline(booking)) return 'Chờ thanh toán';
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
  return null;
};

const mapPaymentStatus = (ttStatus, bookingStatus) => {
  if (ttStatus === 'thanh_cong') return 'da_thanh_toan';
  if (ttStatus === 'that_bai') return 'that_bai';
  if (bookingStatus === 'da_huy' || bookingStatus === 'tu_choi') return 'da_huy';
  return 'cho_thanh_toan';
};

const TRANSACTION_STEP_LABELS = {
  1: 'Đã tạo đặt chỗ',
  2: 'Đã chọn phương thức thanh toán',
  3: 'Đang xử lý thanh toán',
  4: 'Thanh toán thành công',
};
const resolveTransactionStep = (b) => {
  if (b.thanh_toan?.trang_thai === 'thanh_cong') return 4;
  if (canPayOnline(b)) return 3;
  if (['da_huy', 'tu_choi'].includes(b.trang_thai)) {
    return wasBookingPaid(b) ? 4 : 2;
  }
  return 4;
};

const mapCustomerBooking = (b) => {
  const canPay = canPayOnline(b);
  const buoc = resolveTransactionStep(b);
  return {
    ma_dat_phong: b.ma_dat_phong,
    ma_don_hang: b.ma_don_hang,
    ngay_dat: b.ngay_dat,
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
    can_thanh_toan: canPay,
    thanh_toan_trang_thai: mapPaymentStatus(b.thanh_toan?.trang_thai, b.trang_thai),
    han_thanh_toan: canPay ? getPayDeadline(b)?.toISOString() || null : null,
    buoc_giao_dich: buoc,
    buoc_giao_dich_label: TRANSACTION_STEP_LABELS[buoc],
    khach_san: b.loai_phong?.khach_san,
    ten_loai_phong: b.loai_phong?.ten_loai,
    hoan_tien: (wasBookingPaid(b) && b.hoan_tien && Number(b.hoan_tien.so_tien_hoan) > 0)
      ? {
        ma_hoan_tien: b.hoan_tien.ma_hoan_tien,
        trang_thai: b.hoan_tien.trang_thai,
        so_tien_hoan: Number(b.hoan_tien.so_tien_hoan),
        trang_thai_label: getRefundStatusLabel(b.hoan_tien.trang_thai),
      }
      : null,
  };
};
const toDateStr =(d) => {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}
const { formatBedLabel } = require('../../utils/bedHelpers');
const getLoaiGiuongLabel = (room) => formatBedLabel(room);
const mapPaymentMethod = (phuongThucTt) => (
  phuongThucTt === 'truc_tuyen' ? 'online' : 'tai_khach_san'
);
const pickHotelAvatar = (hinhAnh = []) => {
  const main = hinhAnh.find((i) => i.la_anh_chinh) || hinhAnh[0];
  return main?.url || null;
};
const mapCustomerBookingDetail = (booking, reviewStats = null) => {
  const hotel = booking.loai_phong?.khach_san;
  const room = booking.loai_phong;
  const nights = booking.chi_tiet_dat_phong || [];
  const soDem = nights.length || 0;
  const canPay = canPayOnline(booking);
  const buoc = resolveTransactionStep(booking);
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
    can_thanh_toan: canPay,
    han_thanh_toan: canPay ? getPayDeadline(booking)?.toISOString() || null : null,
    buoc_giao_dich: buoc,
    buoc_giao_dich_label: TRANSACTION_STEP_LABELS[buoc],
    co_the_danh_gia: canCustomerReviewBooking(booking).ok,
    da_danh_gia: !!booking.danh_gia,
    danh_gia: mapCustomerReview(booking.danh_gia),
    ngay_dat: booking.ngay_dat,
    khach_san: {
      ma_khach_san: hotel?.ma_khach_san,
      ten: hotel?.ten,
      dia_chi: hotel?.dia_chi,
      so_sao: hotel?.so_sao != null ? Number(hotel.so_sao) : 0,
      gio_nhan_phong: hotel?.gio_nhan_phong || null,
      gio_tra_phong: hotel?.gio_tra_phong || null,
      anh_dai_dien: pickHotelAvatar(hotel?.hinh_anh),
      so_danh_gia: reviewStats?.so_danh_gia ?? 0,
      diem_trung_binh: reviewStats?.diem_trung_binh ?? 0,
    },
    loai_phong: {
      ma_loai_phong: room?.ma_loai_phong,
      ten_loai: room?.ten_loai,
      suc_chua: room?.suc_chua,
      loai_giuong: getLoaiGiuongLabel(room),
      dien_tich: room?.dien_tich != null ? Number(room.dien_tich) : null,
    },
    luu_tru: {
      ngay_nhan: toDateStr(booking.ngay_nhan_phong),
      ngay_tra: toDateStr(booking.ngay_tra_phong),
      so_dem: soDem,
      so_phong: Math.max(Number(booking.so_phong) || 1, 1),
      so_nguoi_lon: booking.so_khach,
      so_tre_em: 0,
    },
    nguoi_dat: {
      ho_ten: booking.ten_nguoi_nhan,
      so_dien_thoai: booking.sdt_nguoi_nhan,
      email: booking.email_nguoi_nhan || booking.khach_hang?.nguoi_dung?.email || null,
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
      ma_khuyen_mai: booking.khuyen_mai?.ma_code || null,
      ten_khuyen_mai: booking.khuyen_mai?.ten || null,
      lan_dat_dau: Boolean(booking.khuyen_mai?.lan_dat_dau),
    },
    hoan_tien: (wasBookingPaid(booking) && booking.hoan_tien && Number(booking.hoan_tien.so_tien_hoan) > 0)
      ? {
        so_tien_hoan: Number(booking.hoan_tien.so_tien_hoan),
        trang_thai: booking.hoan_tien.trang_thai,
        trang_thai_label: getRefundStatusLabel(booking.hoan_tien.trang_thai),
      }
      : null,
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

const buildNightDetails = async (maLoaiPhong, giaCoBan, checkIn, checkOut, roomCount = 1) => {
  const pricing = await calcStayPrice(maLoaiPhong, giaCoBan, checkIn, checkOut, roomCount);
  return (pricing.chi_tiet_dem || []).map((row) => ({
    ngay: parseDate(row.ngay),
    don_gia: row.gia_trung_binh_dem,
    loai_gia: row.so_phong_giam_gia > 0 ? 'giam_gia' : 'co_ban',
  }));
};

const loadPayableOnlineBooking = async (userId, maDatPhong, { isGuest = false } = {}) => {
  let booking;

  const payableInclude = {
    thanh_toan: true,
    khach_hang: {
      select: {
        nguoi_dung: { select: { email: true } },
      },
    },
    loai_phong: {
      select: {
        ten_loai: true,
        khach_san: { select: { ten: true, ma_doi_tac: true } },
      },
    },
  };

  if (isGuest) {
    await expireUnpaidOnlineHolds({ ma_dat_phong: Number(maDatPhong) });
    booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: null,
      },
      include: payableInclude,
    });
  } else {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    await expireUnpaidOnlineHolds({
      ma_dat_phong: Number(maDatPhong),
      ma_khach_hang: khachHang.ma_khach_hang,
    });

    booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: khachHang.ma_khach_hang,
      },
      include: payableInclude,
    });
  }

  if (!booking) {
    throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
  }
  if (isPaymentTimeoutBooking(booking) || !canPayOnline(booking)) {
    throw { statusCode: 400, message: 'Đơn đã hết hạn thanh toán (30 phút) hoặc không thể thanh toán' };
  }
  if (booking.phuong_thuc_tt !== 'truc_tuyen') {
    throw { statusCode: 400, message: 'Đơn này không thanh toán trực tuyến' };
  }
  if (!booking.thanh_toan) {
    throw { statusCode: 400, message: 'Đơn chưa có bản ghi thanh toán' };
  }
  if (booking.thanh_toan.trang_thai === 'thanh_cong') {
    throw { statusCode: 400, message: 'Đơn đã được thanh toán' };
  }
  if (['da_huy', 'tu_choi'].includes(booking.trang_thai)) {
    throw { statusCode: 400, message: 'Không thể thanh toán đơn đã hủy' };
  }
  return booking;
};

const markPaymentSuccess = async (booking, { cong_thanh_toan, ma_tham_chieu, ma_giao_dich }) => {
  const now = new Date();
  const data = {
    cong_thanh_toan,
    phuong_thuc: 'Trực tuyến',
    trang_thai: 'thanh_cong',
    ngay_cap_nhat: now,
    ma_tham_chieu: ma_tham_chieu ? String(ma_tham_chieu) : null,
    ma_loi: null,
    thong_bao_loi: null,
  };
  if (ma_giao_dich) data.ma_giao_dich = String(ma_giao_dich);

  const updated = await prisma.thanh_toan.update({
    where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
    data,
  });

  try {
    const { notifyNewBooking } = require('../../utils/partnerNotify');
    const maDoiTac = booking.loai_phong?.khach_san?.ma_doi_tac;
    if (maDoiTac) {
      await notifyNewBooking(maDoiTac, {
        maDonHang: booking.ma_don_hang,
        maDatPhong: booking.ma_dat_phong,
        tenKhachSan: booking.loai_phong?.khach_san?.ten,
        tenLoaiPhong: booking.loai_phong?.ten_loai,
        tenNguoiNhan: booking.ten_nguoi_nhan,
        ngayNhan: booking.ngay_nhan_phong,
        ngayTra: booking.ngay_tra_phong,
        soTien: booking.thanh_toan_cuoi,
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const { sendBookingConfirmationEmail } = require('../../utils/mailer');
    const to = String(
      booking.email_nguoi_nhan
      || booking.khach_hang?.nguoi_dung?.email
      || '',
    ).trim();
    if (to) {
      await sendBookingConfirmationEmail({
        to,
        maDonHang: booking.ma_don_hang,
        tenKhachSan: booking.loai_phong?.khach_san?.ten,
        tenLoaiPhong: booking.loai_phong?.ten_loai,
        ngayNhan: booking.ngay_nhan_phong,
        ngayTra: booking.ngay_tra_phong,
        soPhong: booking.so_phong,
        phuongThuc: updated.cong_thanh_toan || 'Trực tuyến',
        tongTien: booking.thanh_toan_cuoi ?? updated.so_tien,
      });
    } else {
      console.warn(`[mail] Bỏ qua xác nhận đơn ${booking.ma_don_hang}: thiếu email`);
    }
  } catch (mailErr) {
    console.error(
      `[mail] Gửi xác nhận đơn ${booking.ma_don_hang} thất bại:`,
      mailErr?.message || mailErr,
    );
  }

  return {
    ma_dat_phong: booking.ma_dat_phong,
    ma_don_hang: booking.ma_don_hang,
    thanh_toan_cuoi: Number(booking.thanh_toan_cuoi),
    cong_thanh_toan: updated.cong_thanh_toan,
    trang_thai_thanh_toan: updated.trang_thai,
    ma_giao_dich: updated.ma_giao_dich,
  };
};

const customerBookingService = {
  _loadCustomerBookingRows: async (maKhachHang) => {
    await expireUnpaidOnlineHolds({ ma_khach_hang: maKhachHang });
    await autoCompleteExpiredCheckIns({ ma_khach_hang: maKhachHang });

    const bookings = await prisma.dat_phong.findMany({
      where: {
        ma_khach_hang: maKhachHang,
        OR: [
          { trang_thai: { notIn: ['da_huy', 'tu_choi'] } },
          { thanh_toan: { is: { trang_thai: 'thanh_cong' } } },
        ],
      },
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
            ngay_yeu_cau: true,
            ngay_xu_ly: true,
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

    return bookings.filter((b) => !isPaymentTimeoutBooking(b));
  },

  getMyBookings: async (userId) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) return [];

    const rows = await customerBookingService._loadCustomerBookingRows(khachHang.ma_khach_hang);
    return rows
      .filter((b) => !canPayOnline(b))
      .map(mapCustomerBooking);
  },

  getMyTransactions: async (userId) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) return [];

    const rows = await customerBookingService._loadCustomerBookingRows(khachHang.ma_khach_hang);
    return rows.map(mapCustomerBooking);
  },

  getMyRefunds: async (userId) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) return [];

    await expireUnpaidOnlineHolds({ ma_khach_hang: khachHang.ma_khach_hang });

    const bookings = await prisma.dat_phong.findMany({
      where: {
        ma_khach_hang: khachHang.ma_khach_hang,
        trang_thai: { in: ['da_huy', 'tu_choi'] },
        OR: [
          { hoan_tien: { isNot: null } },
          { thanh_toan: { is: { trang_thai: 'thanh_cong' } } },
        ],
      },
      include: {
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
              },
            },
          },
        },
        thanh_toan: { select: { trang_thai: true, so_tien: true } },
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
            ngay_yeu_cau: true,
            ngay_xu_ly: true,
          },
        },
      },
      orderBy: { ngay_dat: 'desc' },
    });

    return bookings
      .filter((b) => !isPaymentTimeoutBooking(b))
      .map((b) => {
        const base = mapCustomerBooking(b);
        return {
          ...base,
          so_tien_da_thanh_toan: Number(b.thanh_toan?.so_tien || b.thanh_toan_cuoi) || 0,
          ngay_yeu_cau_hoan: b.hoan_tien?.ngay_yeu_cau || null,
          ngay_xu_ly_hoan: b.hoan_tien?.ngay_xu_ly || null,
          ly_do_hoan: b.hoan_tien?.ly_do || base.ly_do_huy || null,
        };
      });
  },

  getMyRefundById: async (userId, maDatPhong) => {
    const id = parseInt(maDatPhong, 10);
    if (Number.isNaN(id)) {
      throw { statusCode: 400, message: 'ID không hợp lệ' };
    }

    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await prisma.dat_phong.findFirst({
      where: {
        ma_dat_phong: id,
        ma_khach_hang: khachHang.ma_khach_hang,
        trang_thai: { in: ['da_huy', 'tu_choi'] },
        OR: [
          { hoan_tien: { isNot: null } },
          { thanh_toan: { is: { trang_thai: 'thanh_cong' } } },
        ],
      },
      include: {
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
              },
            },
          },
        },
        thanh_toan: { select: { trang_thai: true, so_tien: true } },
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
            ngay_yeu_cau: true,
            ngay_xu_ly: true,
          },
        },
      },
    });

    if (!booking || isPaymentTimeoutBooking(booking)) {
      throw { statusCode: 404, message: 'Không tìm thấy yêu cầu hoàn tiền' };
    }

    const base = mapCustomerBooking(booking);
    const soTienHoan = booking.hoan_tien != null ? Number(booking.hoan_tien.so_tien_hoan) || 0 : 0;
    return {
      ...base,
      so_tien_da_thanh_toan: Number(booking.thanh_toan?.so_tien || booking.thanh_toan_cuoi) || 0,
      ngay_yeu_cau_hoan: booking.hoan_tien?.ngay_yeu_cau || null,
      ngay_xu_ly_hoan: booking.hoan_tien?.ngay_xu_ly || null,
      ly_do_hoan: booking.hoan_tien?.ly_do || base.ly_do_huy || null,
      hoan_tien: booking.hoan_tien
        ? {
          ma_hoan_tien: booking.hoan_tien.ma_hoan_tien,
          trang_thai: booking.hoan_tien.trang_thai,
          so_tien_hoan: soTienHoan,
          trang_thai_label: getRefundStatusLabel(booking.hoan_tien.trang_thai),
        }
        : base.hoan_tien,
    };
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
    // tìm hồ sơ khách hàng
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

    await expireUnpaidOnlineHolds({
      ma_dat_phong: id,
      ma_khach_hang: khachHang.ma_khach_hang,
    });
    await autoCompleteExpiredCheckIns({
      ma_dat_phong: id,
      ma_khach_hang: khachHang.ma_khach_hang,
    });
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
            so_giuong_don: true,
            so_giuong_doi: true,
            so_giuong_lon: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
                so_sao: true,
                gio_nhan_phong: true,
                gio_tra_phong: true,
              },
            },
          },
        },
        chi_tiet_dat_phong: { orderBy: { ngay: 'asc' } },
        thanh_toan: true,
        khuyen_mai: { select: { ma_khuyen_mai: true, ma_code: true, ten: true, lan_dat_dau: true } },
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

    if (
      ['da_huy', 'tu_choi'].includes(booking.trang_thai)
      && booking.thanh_toan?.trang_thai !== 'thanh_cong'
    ) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }

    if (isPaymentTimeoutBooking(booking)) {
      throw { statusCode: 410, message: 'Đơn đã hết hạn thanh toán và không còn hiệu lực' };
    }
    if (canPayOnline(booking) && !booking.ma_khuyen_mai) {
      const applied = await tryAutoApplyFirstBookingPromo({
        maKhachHang: khachHang.ma_khach_hang,
        maDatPhong: booking.ma_dat_phong,
        maKhachSan: booking.loai_phong?.khach_san?.ma_khach_san,
        tongTienGoc: booking.tong_tien_goc,
        thanhToanId: booking.thanh_toan?.ma_thanh_toan,
      });
      if (applied) {
        return customerBookingService.getBookingById(userId, id);
      }
    }
  
    const hotel = booking.loai_phong?.khach_san;
    let reviewStats = { so_danh_gia: 0, diem_trung_binh: 0 };
    if (hotel?.ma_khach_san) {
      const [withImg] = await attachHotelImages([hotel]);
      booking.loai_phong.khach_san = withImg;
      const [statsRow] = await prisma.$queryRaw`
        SELECT COUNT(dg.ma_danh_gia) AS so_danh_gia,
               AVG(dg.so_sao) AS diem_trung_binh
        FROM danh_gia dg
        INNER JOIN dat_phong dp ON dp.ma_dat_phong = dg.ma_dat_phong
        INNER JOIN loai_phong lp ON lp.ma_loai_phong = dp.ma_loai_phong
        WHERE lp.ma_khach_san = ${Number(hotel.ma_khach_san)}
          AND dg.trang_thai = 'hien_thi'
      `;
      reviewStats = {
        so_danh_gia: Number(statsRow?.so_danh_gia) || 0,
        diem_trung_binh: statsRow?.diem_trung_binh != null
          ? Math.round(Number(statsRow.diem_trung_binh) * 10) / 10
          : 0,
      };
    }

    return mapCustomerBookingDetail(booking, reviewStats);
  },
  createBooking: async (userId, data) => {
    const isGuest = userId == null;
    const {
      ma_loai_phong,
      ngay_nhan,
      ngay_tra,
      so_khach,
      so_phong = 1,
      tre_em = 0,
      tuoi_tre_em = [],
      ten_nguoi_nhan,
      sdt_nguoi_nhan,
      email,
      phuong_thuc_tt = 'truc_tuyen',
      ghi_chu,
      ma_code,
    } = data;

    if (!ma_loai_phong || !ngay_nhan || !ngay_tra) {
      throw { statusCode: 400, message: 'Thiếu thông tin đặt phòng' };
    }
    if (!ten_nguoi_nhan?.trim()) {
      throw { statusCode: 400, message: 'Vui lòng nhập họ tên người nhận phòng' };
    }
    if (ten_nguoi_nhan.trim().length < 2) {
      throw { statusCode: 400, message: 'Họ tên phải có ít nhất 2 ký tự' };
    }
    const phoneErr = validatePhone(sdt_nguoi_nhan, { required: true });
    if (phoneErr) {
      throw { statusCode: 400, message: phoneErr };
    }

    const emailErr = validateEmail(email, { required: true });
    if (emailErr) {
      throw { statusCode: 400, message: emailErr };
    }

    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);
    const roomCount = Math.max(Number(so_phong) || 1, 1);
    const guestsPerRoom = Math.ceil(guests / roomCount);
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
    if (roomCount > guests) {
      throw { statusCode: 400, message: 'Số phòng không được lớn hơn số khách' };
    }

    let khachHang = null;
    if (!isGuest) {
      khachHang = await prisma.khach_hang.findUnique({
        where: { ma_nguoi_dung: Number(userId) },
      });
      if (!khachHang) {
        throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
      }
    }

    const room = await prisma.loai_phong.findFirst({
      where: { ma_loai_phong: Number(ma_loai_phong), trang_thai: 'hoat_dong' },
      include: {
        khach_san: {
          select: {
            ma_khach_san: true,
            ma_doi_tac: true,
            ten: true,
            trang_thai: true,
            chinh_sach_khach_san: true,
          },
        },
      },
    });

    if (!room || room.khach_san.trang_thai !== 'hoat_dong') {
      throw { statusCode: 404, message: 'Loại phòng không khả dụng' };
    }
    if (room.suc_chua < guestsPerRoom) {
      throw {
        statusCode: 400,
        message: `Mỗi phòng chỉ chứa tối đa ${room.suc_chua} khách (cần ${guestsPerRoom} người lớn/phòng)`,
      };
    }
    await expireUnpaidOnlineHolds();

    const booked = await countOverlappingBookings(room.ma_loai_phong, checkIn, checkOut);
    const conLai = Number(room.so_luong_mo_ban) - booked;
    if (conLai < roomCount) {
      throw {
        statusCode: 409,
        message: conLai <= 0
          ? 'Phòng đã hết chỗ trong khoảng thời gian này'
          : `Chỉ còn ${conLai} phòng trống, không đủ ${roomCount} phòng`,
      };
    }

    const policy = room.khach_san.chinh_sach_khach_san || {};
    const pricing = await calcStayPrice(
      room.ma_loai_phong,
      room.gia_co_ban,
      checkIn,
      checkOut,
      roomCount,
    );
    const tienPhong = pricing.tong_luong_tru_tat_ca
      || pricing.tong_luong_tru * roomCount;
    const chiTietRows = (await buildNightDetails(
      room.ma_loai_phong,
      room.gia_co_ban,
      checkIn,
      checkOut,
      roomCount,
    ))
      .map((row) => ({
        ...row,
        don_gia: Number(row.don_gia) * roomCount,
      }));

    let promo = null;
    let tienGiam = 0;
    const agesForPricing = Array.isArray(tuoi_tre_em) || typeof tuoi_tre_em === 'string'
      ? tuoi_tre_em
      : [];

    const hotelVatRate = Number(policy.phan_tram_vat) || 10;
    const invoiceForPromoBase = buildStayInvoice({
      tien_phong: tienPhong,
      so_dem: pricing.so_dem,
      so_phong: roomCount,
      tuoi_tre_em: agesForPricing,
      tuoi_toi_da_mien_phi: policy.tuoi_toi_da_mien_phi,
      phu_thu_tre_em: policy.phu_thu_tre_em,
      phan_tram_vat: hotelVatRate,
      tien_giam: 0,
    });
    const tongTien = invoiceForPromoBase.tam_tinh;

    const isFirstBooking = khachHang
      ? await isCustomerFirstBooking(prisma, khachHang.ma_khach_hang)
      : false;

    if (ma_code && String(ma_code).trim()) {
      await syncExpiredPromotions(prisma);
      promo = await prisma.khuyen_mai.findUnique({
        where: { ma_code: String(ma_code).trim().toUpperCase() },
      });
      try {
        tienGiam = assertPromotionApplicable(promo, {
          maKhachSan: room.khach_san.ma_khach_san,
          tongTien,
          isFirstBooking,
        });
        if (khachHang) {
          await assertCustomerHasNotUsedPromotion(prisma, {
            maKhachHang: khachHang.ma_khach_hang,
            maKhuyenMai: promo.ma_khuyen_mai,
          });
        }
      } catch (err) {
        throw { statusCode: err.statusCode || 400, message: err.message };
      }
    } else if (isFirstBooking && khachHang) {
      const firstPromo = await findActiveFirstBookingPromo(prisma);
      if (firstPromo) {
        try {
          tienGiam = assertPromotionApplicable(firstPromo, {
            maKhachSan: room.khach_san.ma_khach_san,
            tongTien,
            isFirstBooking: true,
          });
          await assertCustomerHasNotUsedPromotion(prisma, {
            maKhachHang: khachHang.ma_khach_hang,
            maKhuyenMai: firstPromo.ma_khuyen_mai,
          });
          promo = firstPromo;
        } catch {
          promo = null;
          tienGiam = 0;
        }
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
          isFirstBooking,
        });
        if (khachHang) {
          await assertCustomerHasNotUsedPromotion(tx, {
            maKhachHang: khachHang.ma_khach_hang,
            maKhuyenMai: promo.ma_khuyen_mai,
          });
        }
      }

      const invoice = buildStayInvoice({
        tien_phong: tienPhong,
        so_dem: pricing.so_dem,
        so_phong: roomCount,
        tuoi_tre_em: agesForPricing,
        tuoi_toi_da_mien_phi: policy.tuoi_toi_da_mien_phi,
        phu_thu_tre_em: policy.phu_thu_tre_em,
        phan_tram_vat: hotelVatRate,
        tien_giam: tienGiam,
      });
      const finalThanhToan = invoice.thanh_toan_cuoi;

      const created = await tx.dat_phong.create({
        data: {
          ma_khach_hang: khachHang ? khachHang.ma_khach_hang : null,
          ma_loai_phong: room.ma_loai_phong,
          ma_khuyen_mai: promo ? promo.ma_khuyen_mai : null,
          ma_don_hang: generateOrderCode(),
          ngay_nhan_phong: checkIn,
          ngay_tra_phong: checkOut,
          so_khach: guests,
          so_phong: roomCount,
          ten_nguoi_nhan: ten_nguoi_nhan.trim(),
          sdt_nguoi_nhan: sdt_nguoi_nhan.trim(),
          email_nguoi_nhan: String(email).trim(),
          tong_tien_goc: invoice.tam_tinh,
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
              cong_thanh_toan: isOnline ? null : 'Tại khách sạn',
              trang_thai: 'cho',
              thoi_gian: now,
              ngay_cap_nhat: null,
              ma_tham_chieu: null,
            },
          },
        },
        include: {
          thanh_toan: true,
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ten: true, ma_doi_tac: true } },
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
    if (!isOnline) {
      try {
        const { notifyNewBooking } = require('../../utils/partnerNotify');
        await notifyNewBooking(room.khach_san.ma_doi_tac, {
          maDonHang: booking.ma_don_hang,
          maDatPhong: booking.ma_dat_phong,
          tenKhachSan: booking.loai_phong?.khach_san?.ten || room.khach_san?.ten,
          tenLoaiPhong: booking.loai_phong?.ten_loai || room.ten_loai,
          tenNguoiNhan: booking.ten_nguoi_nhan,
          ngayNhan: booking.ngay_nhan_phong,
          ngayTra: booking.ngay_tra_phong,
          soTien: booking.thanh_toan_cuoi,
        });
      } catch {
        /* ignore */
      }
    }

    const result = {
      ma_dat_phong: booking.ma_dat_phong,
      ma_don_hang: booking.ma_don_hang,
      ngay_nhan_phong: booking.ngay_nhan_phong,
      ngay_tra_phong: booking.ngay_tra_phong,
      so_khach: booking.so_khach,
      so_phong: booking.so_phong,
      tong_tien_goc: Number(booking.tong_tien_goc),
      tien_giam: Number(booking.tien_giam),
      thanh_toan_cuoi: Number(booking.thanh_toan_cuoi),
      trang_thai: booking.trang_thai,
      trang_thai_label: BOOKING_STATUS[booking.trang_thai],
      can_thanh_toan: isOnline,
      ten_loai_phong: booking.loai_phong?.ten_loai,
      ten_khach_san: booking.loai_phong?.khach_san?.ten,
      is_guest: isGuest,
    };
    if (isGuest) {
      result.guest_access_token = signGuestPayToken(
        booking.ma_dat_phong,
        booking.email_nguoi_nhan,
      );
    }
    return result;
  },

  _loadPromoPayableBooking: async ({ maDatPhong, maKhachHang = undefined, isGuest = false }) => {
    const where = { ma_dat_phong: Number(maDatPhong) };
    if (isGuest) where.ma_khach_hang = null;
    else if (maKhachHang != null) where.ma_khach_hang = Number(maKhachHang);

    if (!isGuest && maKhachHang != null) {
      await expireUnpaidOnlineHolds({
        ma_dat_phong: Number(maDatPhong),
        ma_khach_hang: Number(maKhachHang),
      });
    } else {
      await expireUnpaidOnlineHolds({ ma_dat_phong: Number(maDatPhong) });
    }

    const booking = await prisma.dat_phong.findFirst({
      where,
      include: {
        thanh_toan: true,
        loai_phong: { select: { ma_khach_san: true } },
        khuyen_mai: { select: { ma_khuyen_mai: true, ma_code: true } },
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (!canPayOnline(booking)) {
      throw { statusCode: 400, message: 'Chỉ áp mã khi đơn đang chờ thanh toán trong 30 phút' };
    }
    return booking;
  },

  applyPromo: async (userId, maDatPhong, data = {}) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      maKhachHang: khachHang.ma_khach_hang,
    });
    await applyPromoOnBooking(booking, data.ma_code, khachHang.ma_khach_hang);
    return customerBookingService.getBookingById(userId, maDatPhong);
  },

  applyPromoGuest: async (maDatPhong, data = {}) => {
    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      isGuest: true,
    });
    await applyPromoOnBooking(booking, data.ma_code, null);
    return customerBookingService.getBookingByIdGuest(maDatPhong);
  },

  removePromo: async (userId, maDatPhong) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      maKhachHang: khachHang.ma_khach_hang,
    });
    await removePromoOnBooking(booking);
    return customerBookingService.getBookingById(userId, maDatPhong);
  },

  removePromoGuest: async (maDatPhong) => {
    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      isGuest: true,
    });
    await removePromoOnBooking(booking);
    return customerBookingService.getBookingByIdGuest(maDatPhong);
  },

  listEligiblePromotions: async (userId, maDatPhong) => {
    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      maKhachHang: khachHang.ma_khach_hang,
    });
    return listEligiblePromotionsForBooking(booking, khachHang.ma_khach_hang);
  },

  listEligiblePromotionsGuest: async (maDatPhong) => {
    const booking = await customerBookingService._loadPromoPayableBooking({
      maDatPhong,
      isGuest: true,
    });
    return listEligiblePromotionsForBooking(booking, null);
  },

  confirmPayment: async (userId, maDatPhong, data = {}) => {
    const GATEWAY_MAP = {
      momo: 'MoMo',
      the_tin_dung: 'Thẻ tín dụng',
    };

    const gatewayKey = String(data.cong_thanh_toan || data.phuong_thuc || 'momo').trim();
    if (gatewayKey === 'vnpay') {
      throw {
        statusCode: 400,
        message: 'VNPay cần chuyển hướng cổng thanh toán. Vui lòng dùng nút thanh toán VNPay.',
      };
    }
    const gatewayLabel = GATEWAY_MAP[gatewayKey];
    if (!gatewayLabel) {
      throw { statusCode: 400, message: 'Phương thức thanh toán không hợp lệ' };
    }

    const booking = await loadPayableOnlineBooking(userId, maDatPhong);
    const result = await markPaymentSuccess(booking, {
      cong_thanh_toan: gatewayLabel,
      ma_tham_chieu: String(3145689000 + Math.floor(Math.random() * 999999)),
    });
    return result;
  },

  createVnpayPayment: async (userId, maDatPhong, ipAddr) => {
    const booking = await loadPayableOnlineBooking(userId, maDatPhong);
    const amountVnd = Number(booking.thanh_toan_cuoi) || Number(booking.thanh_toan?.so_tien) || 0;
    if (amountVnd <= 0) {
      throw { statusCode: 400, message: 'Số tiền thanh toán không hợp lệ' };
    }

    const txnRef = `${booking.ma_don_hang}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100);
    const paymentUrl = buildPaymentUrl({
      amountVnd,
      txnRef,
      orderInfo: `Thanh toan don ${booking.ma_don_hang}`,
      ipAddr: ipAddr || '127.0.0.1',
      expireMinutes: 15,
    });

    await prisma.thanh_toan.update({
      where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
      data: {
        cong_thanh_toan: 'VNPay',
        phuong_thuc: 'Trực tuyến',
        ma_giao_dich: txnRef,
        trang_thai: 'cho',
        ma_loi: null,
        thong_bao_loi: null,
        ngay_cap_nhat: new Date(),
      },
    });

    return {
      ma_dat_phong: booking.ma_dat_phong,
      ma_don_hang: booking.ma_don_hang,
      payment_url: paymentUrl,
      ma_giao_dich: txnRef,
    };
  },

  handleVnpayReturn: async (query) => {
    let verified;
    try {
      verified = verifyReturn(query);
    } catch (err) {
      return {
        ok: false,
        redirectPath: '/my-bookings',
        vnpay: 'fail',
        message: err.message || 'Cấu hình VNPay không hợp lệ',
      };
    }

    if (!verified.valid) {
      return {
        ok: false,
        redirectPath: '/my-bookings',
        vnpay: 'fail',
        message: 'Chữ ký VNPay không hợp lệ',
      };
    }

    const txnRef = verified.txnRef;
    const booking = await prisma.dat_phong.findFirst({
      where: {
        thanh_toan: { is: { ma_giao_dich: txnRef } },
      },
      include: {
        thanh_toan: true,
        khach_hang: {
          select: {
            nguoi_dung: { select: { email: true } },
          },
        },
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: { select: { ten: true, ma_doi_tac: true } },
          },
        },
      },
    });

    if (!booking) {
      return {
        ok: false,
        redirectPath: '/my-bookings',
        vnpay: 'fail',
        message: 'Không tìm thấy đơn thanh toán',
      };
    }

    const redirectPath = `/payment/${booking.ma_dat_phong}`;

    if (booking.thanh_toan?.trang_thai === 'thanh_cong') {
      return {
        ok: true,
        redirectPath,
        vnpay: 'success',
        message: 'Đơn đã được thanh toán',
        ma_dat_phong: booking.ma_dat_phong,
      };
    }

    if (verified.success) {
      await markPaymentSuccess(booking, {
        cong_thanh_toan: 'VNPay',
        ma_tham_chieu: verified.transactionNo || txnRef,
        ma_giao_dich: txnRef,
      });
      return {
        ok: true,
        redirectPath,
        vnpay: 'success',
        message: verified.message,
        ma_dat_phong: booking.ma_dat_phong,
      };
    }

    await prisma.thanh_toan.update({
      where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
      data: {
        cong_thanh_toan: 'VNPay',
        trang_thai: 'that_bai',
        ma_loi: verified.responseCode || '99',
        thong_bao_loi: verified.message,
        ngay_cap_nhat: new Date(),
      },
    });

    return {
      ok: false,
      redirectPath,
      vnpay: 'fail',
      message: verified.message,
      ma_dat_phong: booking.ma_dat_phong,
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
      include: {
        thanh_toan: true,
        loai_phong: {
          select: {
            khach_san: { select: { ten: true, ma_doi_tac: true } },
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

    const reason = lyDo?.trim() || 'Khách hàng hủy đơn';
    const paid = wasBookingPaid(booking);
    let refundRow = null;

    await prisma.$transaction(async (tx) => {
      if (!paid) {
        await purgeUnpaidBooking(tx, booking);
        return;
      }

      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(maDatPhong) },
        data: { trang_thai: 'da_huy', ghi_chu: reason },
      });
      refundRow = await processRefundOnCancel(tx, maDatPhong, reason);
      const { ensureCommissionForBooking } = require('../../utils/commissionHelpers');
      await ensureCommissionForBooking(maDatPhong, { tx, forceRecalc: true });
    });

    if (refundRow) {
      try {
        const { notifyRefundRequest } = require('../../utils/adminNotify');
        await notifyRefundRequest({
          maHoanTien: refundRow.ma_hoan_tien,
          maDatPhong: booking.ma_dat_phong,
          maDonHang: booking.ma_don_hang,
          soTienHoan: refundRow.so_tien_hoan,
          lyDo: reason,
        });
      } catch {
        /* ignore */
      }
    }
    if (paid) {
      try {
        const { notifyBookingCancelled } = require('../../utils/partnerNotify');
        const maDoiTac = booking.loai_phong?.khach_san?.ma_doi_tac;
        if (maDoiTac) {
          await notifyBookingCancelled(maDoiTac, {
            maDonHang: booking.ma_don_hang,
            maDatPhong: booking.ma_dat_phong,
            tenKhachSan: booking.loai_phong?.khach_san?.ten,
            lyDo: reason,
            cancelledBy: 'khach',
          });
        }
      } catch {
        /* ignore */
      }
    }

    if (!paid) {
      return {
        ma_dat_phong: Number(maDatPhong),
        trang_thai: 'da_huy',
        an_khoi_danh_sach: true,
      };
    }

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
      include: {
        danh_gia: true,
        loai_phong: {
          select: {
            khach_san: { select: { ten: true, ma_doi_tac: true } },
          },
        },
        khach_hang: { select: { ho_ten: true } },
      },
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

    try {
      const { notifyNewReview } = require('../../utils/partnerNotify');
      const maDoiTac = booking.loai_phong?.khach_san?.ma_doi_tac;
      if (maDoiTac) {
        await notifyNewReview(maDoiTac, {
          maDonHang: booking.ma_don_hang,
          maDatPhong: booking.ma_dat_phong,
          tenKhachSan: booking.loai_phong?.khach_san?.ten,
          tenKhachHang: booking.khach_hang?.ho_ten || khachHang.ho_ten,
          soSao: review.so_sao,
          noiDung: review.noi_dung,
        });
      }
    } catch {
      /* ignore */
    }

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

  confirmPaymentGuest: async (maDatPhong, data = {}) => {
    const GATEWAY_MAP = { momo: 'MoMo', the_tin_dung: 'Thẻ tín dụng' };
    const gatewayKey = String(data.cong_thanh_toan || data.phuong_thuc || 'momo').trim();
    if (gatewayKey === 'vnpay') {
      throw {
        statusCode: 400,
        message: 'VNPay cần chuyển hướng cổng thanh toán. Vui lòng dùng nút thanh toán VNPay.',
      };
    }
    const gatewayLabel = GATEWAY_MAP[gatewayKey];
    if (!gatewayLabel) {
      throw { statusCode: 400, message: 'Phương thức thanh toán không hợp lệ' };
    }
    const booking = await loadPayableOnlineBooking(null, maDatPhong, { isGuest: true });
    return markPaymentSuccess(booking, {
      cong_thanh_toan: gatewayLabel,
      ma_tham_chieu: String(3145689000 + Math.floor(Math.random() * 999999)),
    });
  },

  createVnpayPaymentGuest: async (maDatPhong, ipAddr) => {
    const booking = await loadPayableOnlineBooking(null, maDatPhong, { isGuest: true });
    const amountVnd = Number(booking.thanh_toan_cuoi) || Number(booking.thanh_toan?.so_tien) || 0;
    if (amountVnd <= 0) {
      throw { statusCode: 400, message: 'Số tiền thanh toán không hợp lệ' };
    }
    const txnRef = `${booking.ma_don_hang}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100);
    const paymentUrl = buildPaymentUrl({
      amountVnd,
      txnRef,
      orderInfo: `Thanh toan don ${booking.ma_don_hang}`,
      ipAddr: ipAddr || '127.0.0.1',
      expireMinutes: 15,
    });
    await prisma.thanh_toan.update({
      where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
      data: {
        cong_thanh_toan: 'VNPay',
        phuong_thuc: 'Trực tuyến',
        ma_giao_dich: txnRef,
        trang_thai: 'cho',
        ma_loi: null,
        thong_bao_loi: null,
        ngay_cap_nhat: new Date(),
      },
    });
    return {
      ma_dat_phong: booking.ma_dat_phong,
      ma_don_hang: booking.ma_don_hang,
      payment_url: paymentUrl,
      ma_giao_dich: txnRef,
    };
  },

  getBookingByIdGuest: async (maDatPhong) => {
    const id = Number(maDatPhong);
    await expireUnpaidOnlineHolds({ ma_dat_phong: id });
    const booking = await prisma.dat_phong.findFirst({
      where: { ma_dat_phong: id, ma_khach_hang: null },
      include: {
        loai_phong: {
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            suc_chua: true,
            dien_tich: true,
            so_giuong: true,
            so_giuong_don: true,
            so_giuong_doi: true,
            so_giuong_lon: true,
            khach_san: {
              select: {
                ma_khach_san: true,
                ten: true,
                dia_chi: true,
                so_sao: true,
                gio_nhan_phong: true,
                gio_tra_phong: true,
              },
            },
          },
        },
        chi_tiet_dat_phong: { orderBy: { ngay: 'asc' } },
        thanh_toan: true,
        khuyen_mai: { select: { ma_khuyen_mai: true, ma_code: true, ten: true, lan_dat_dau: true } },
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
          },
        },
      },
    });
    if (!booking || isPaymentTimeoutBooking(booking)) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (
      ['da_huy', 'tu_choi'].includes(booking.trang_thai)
      && booking.thanh_toan?.trang_thai !== 'thanh_cong'
    ) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    const hotel = booking.loai_phong?.khach_san;
    if (hotel?.ma_khach_san) {
      const [withImg] = await attachHotelImages([hotel]);
      booking.loai_phong.khach_san = withImg;
    }
    const detail = mapCustomerBookingDetail(booking, null);
    detail.co_the_danh_gia = false;
    detail.is_guest = true;
    return detail;
  },

  getCancelPreviewGuest: async (maDatPhong) => {
    const booking = await prisma.dat_phong.findFirst({
      where: { ma_dat_phong: Number(maDatPhong), ma_khach_hang: null },
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
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    if (!CANCELLABLE_STATUS.includes(booking.trang_thai)) {
      throw { statusCode: 400, message: 'Chỉ hủy được đơn chưa check-in' };
    }
    const policies = booking.loai_phong?.khach_san?.chinh_sach_huy || [];
    const calc = calcRefundFromPolicy(
      policies,
      booking.ngay_nhan_phong,
      new Date(),
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
        phan_tram_hoan: paid ? calc.phan_tram_hoan : 0,
        so_tien_hoan: paid ? calc.so_tien_hoan : 0,
      },
      tom_tat: paid
        ? (calc.so_tien_hoan > 0
          ? `Theo chính sách hủy, bạn được hoàn ${calc.phan_tram_hoan}% (tương đương ${calc.so_tien_hoan.toLocaleString('vi-VN')}đ).`
          : 'Theo chính sách hủy, bạn không được hoàn tiền.')
        : 'Bạn thanh toán tại khách sạn nên không phát sinh hoàn tiền.',
    };
  },

  cancelBookingGuest: async (maDatPhong, lyDo) => {
    const booking = await prisma.dat_phong.findFirst({
      where: { ma_dat_phong: Number(maDatPhong), ma_khach_hang: null },
      include: {
        thanh_toan: true,
        loai_phong: {
          select: { khach_san: { select: { ten: true, ma_doi_tac: true } } },
        },
      },
    });
    if (!booking) throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    if (!CANCELLABLE_STATUS.includes(booking.trang_thai)) {
      throw { statusCode: 400, message: 'Chỉ hủy được đơn chưa check-in' };
    }

    const reason = lyDo?.trim() || 'Khách hủy đơn';
    const paid = wasBookingPaid(booking);
    let refundRow = null;

    await prisma.$transaction(async (tx) => {
      if (!paid) {
        await purgeUnpaidBooking(tx, booking);
        return;
      }
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(maDatPhong) },
        data: { trang_thai: 'da_huy', ghi_chu: reason },
      });
      refundRow = await processRefundOnCancel(tx, maDatPhong, reason);
      const { ensureCommissionForBooking } = require('../../utils/commissionHelpers');
      await ensureCommissionForBooking(maDatPhong, { tx, forceRecalc: true });
    });

    if (refundRow) {
      try {
        const { notifyRefundRequest } = require('../../utils/adminNotify');
        await notifyRefundRequest({
          maHoanTien: refundRow.ma_hoan_tien,
          maDatPhong: booking.ma_dat_phong,
          maDonHang: booking.ma_don_hang,
          soTienHoan: refundRow.so_tien_hoan,
          lyDo: reason,
        });
      } catch { /* ignore */ }
    }

    if (paid) {
      try {
        const { notifyBookingCancelled } = require('../../utils/partnerNotify');
        const maDoiTac = booking.loai_phong?.khach_san?.ma_doi_tac;
        if (maDoiTac) {
          await notifyBookingCancelled(maDoiTac, {
            maDonHang: booking.ma_don_hang,
            maDatPhong: booking.ma_dat_phong,
            tenKhachSan: booking.loai_phong?.khach_san?.ten,
            lyDo: reason,
            cancelledBy: 'khach',
          });
        }
      } catch { /* ignore */ }
    }

    if (!paid) {
      return { ma_dat_phong: Number(maDatPhong), trang_thai: 'da_huy', an_khoi_danh_sach: true };
    }
    return {
      ma_dat_phong: Number(maDatPhong),
      trang_thai: 'da_huy',
      so_tien_hoan: refundRow ? Number(refundRow.so_tien_hoan) : 0,
    };
  },

  claimGuestBooking: async (userId, maDatPhong, guestToken) => {
    if (!guestToken) {
      throw { statusCode: 400, message: 'Thiếu phiên thanh toán khách vãng lai' };
    }
    let payload;
    try {
      payload = verifyGuestPayToken(guestToken);
    } catch {
      throw { statusCode: 403, message: 'Phiên thanh toán không hợp lệ hoặc đã hết hạn' };
    }
    if (Number(payload.mid) !== Number(maDatPhong)) {
      throw { statusCode: 403, message: 'Không có quyền gắn đơn này' };
    }

    const user = await prisma.nguoi_dung.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
      select: { ma_nguoi_dung: true, vai_tro: true, trang_thai: true },
    });
    if (!user || user.vai_tro !== 'khach_hang') {
      throw { statusCode: 403, message: 'Chỉ tài khoản khách hàng mới gắn được đơn để dùng voucher' };
    }
    if (user.trang_thai === 'bi_khoa') {
      throw { statusCode: 403, message: 'Tài khoản đã bị khóa' };
    }

    const khachHang = await prisma.khach_hang.findUnique({
      where: { ma_nguoi_dung: Number(userId) },
    });
    if (!khachHang) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ khách hàng' };
    }

    const id = Number(maDatPhong);
    const existing = await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: id },
      select: { ma_dat_phong: true, ma_khach_hang: true },
    });
    if (!existing) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đặt phòng' };
    }
    if (existing.ma_khach_hang != null) {
      if (Number(existing.ma_khach_hang) === Number(khachHang.ma_khach_hang)) {
        return customerBookingService.getBookingById(userId, id);
      }
      throw { statusCode: 409, message: 'Đơn đã được gắn với tài khoản khác' };
    }

    await prisma.dat_phong.update({
      where: { ma_dat_phong: id },
      data: { ma_khach_hang: khachHang.ma_khach_hang },
    });

    return customerBookingService.getBookingById(userId, id);
  },
};

module.exports = customerBookingService;
