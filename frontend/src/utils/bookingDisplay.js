import {
  BOOKING_STATUS,
  REFUND_STATUS,
  badgeMeta,
  textMeta,
} from '../constants/statusConfig';

// Nhãn + màu đặt phòng lấy từ nguồn tập trung (statusConfig)
const buildMap = (source, variant) => Object.fromEntries(
  Object.keys(source).map((key) => [
    key,
    variant === 'text' ? textMeta(source, key) : badgeMeta(source, key),
  ]),
);

export const TRANG_THAI = buildMap(BOOKING_STATUS, 'badge');
export const PARTNER_TRANG_THAI = buildMap(BOOKING_STATUS, 'text');

export const PHUONG_THUC = {
  truc_tuyen: 'Trực tuyến',
  tai_khach_san: 'Tại khách sạn',
};

export const REFUND_TRANG_THAI = buildMap(REFUND_STATUS, 'badge');

// Badge hoàn tiền dùng nhãn dài hơn nhưng vẫn đồng bộ màu với REFUND_STATUS
export const REFUND_BADGE = {
  cho_xu_ly: { label: 'Chờ xử lý hoàn tiền', cls: REFUND_STATUS.cho_xu_ly.badge },
  dang_xu_ly: { label: 'Đang xử lý hoàn tiền', cls: REFUND_STATUS.dang_xu_ly.badge },
  da_hoan: { label: 'Đã hoàn tiền', cls: REFUND_STATUS.da_hoan.badge },
  tu_choi: { label: 'Từ chối hoàn tiền', cls: REFUND_STATUS.tu_choi.badge },
};

export const getRefundBadgeMeta = (trangThaiHoan) => {
  if (!trangThaiHoan) return null;
  return REFUND_BADGE[trangThaiHoan] || { label: trangThaiHoan, cls: 'badge-default' };
};

export const getRefundDisplay = (booking) => {
  const status = booking?.hoan_tien?.trang_thai
    || booking?.thong_tin_hoan_tien?.trang_thai_hoan;
  if (!status) return null;
  return REFUND_TRANG_THAI[status] || { label: status, cls: 'badge-default' };
};
export const CUSTOMER_PAYMENT_STATUS = {
  cho_thanh_toan: 'Chờ thanh toán',
  da_thanh_toan: 'Đã thanh toán',
  that_bai: 'Thanh toán thất bại',
  da_huy: 'Đã hủy',
};
export const CUSTOMER_PAYMENT_METHOD = {
  online: 'Thanh toán trực tuyến',
  tai_khach_san: 'Thanh toán tại khách sạn',
};
export const formatBookingDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
};
export const buildCancelNoticeContent = (refundInfo) => {
  if (!refundInfo) return null;

  if (refundInfo.tom_tat_chinh_sach) {
    return {
      policyLine: refundInfo.tom_tat_chinh_sach,
      statusLine: null,
      summaryText: refundInfo.tom_tat_chinh_sach,
      refundBadge: getRefundBadgeMeta(refundInfo.trang_thai_hoan),
    };
  }

  const {
    phan_tram_hoan: phanTram,
    so_tien_hoan: soTienHoan,
    da_thanh_toan_online: paid,
    trang_thai_hoan: trangThaiHoan,
  } = refundInfo;

  let policyLine = '';
  if (paid && Number(soTienHoan) > 0) {
    policyLine = `Theo chính sách: khách được hoàn lại ${phanTram}% số tiền (tương đương ${Number(soTienHoan).toLocaleString('vi-VN')}đ).`;
  } else if (paid) {
    policyLine = 'Theo chính sách hủy, khách không được hoàn tiền cho đơn này.';
  } else {
    policyLine = 'Khách chưa thanh toán online nên không phát sinh hoàn tiền.';
  }

  let statusLine = null;

  if (trangThaiHoan === 'cho_xu_ly' || trangThaiHoan === 'dang_xu_ly') {
    statusLine = 'Yêu cầu hoàn tiền đang chờ xử lý.';
  } else if (trangThaiHoan === 'da_hoan') {
    statusLine = 'Admin đã hoàn tiền cho khách.';
  } else if (trangThaiHoan === 'tu_choi') {
    statusLine = 'Yêu cầu hoàn tiền đã bị từ chối.';
  }

  const summaryText = statusLine ? `${policyLine} ${statusLine}` : policyLine;

  return { policyLine, statusLine, summaryText, refundBadge: getRefundBadgeMeta(trangThaiHoan) };
};

export const isCancelledBooking = (booking) =>
  ['da_huy', 'tu_choi'].includes(booking?.trang_thai);

export const extractCancelReasonFromNote = (ghiChu) => {
  if (!ghiChu?.trim()) return null;
  const adminMatch = ghiChu.match(/^\[Admin hủy\]\s*(.+)$/i);
  if (adminMatch) return adminMatch[1].trim();
  return ghiChu.trim();
};

export const getBookingCancelReason = (booking) => {
  if (!isCancelledBooking(booking)) return null;
  return booking.thong_tin_hoan_tien?.ly_do_huy
    || booking.ly_do_huy
    || booking.hoan_tien?.ly_do
    || extractCancelReasonFromNote(booking.ghi_chu);
};

export const isOnlinePaid = (booking) => {
  if (!booking || isCancelledBooking(booking)) return false;
  if (booking.phuong_thuc_tt === 'truc_tuyen') return true;
  return booking.thanh_toan?.trang_thai === 'thanh_cong';
};

const getRefundStatus = (booking) =>
  booking?.hoan_tien?.trang_thai
  || booking?.thong_tin_hoan_tien?.trang_thai_hoan
  || null;

export const getPaymentDisplay = (booking) => {
  if (isCancelledBooking(booking)) {
    const refundStatus = getRefundStatus(booking);
    const refundInfo = booking?.thong_tin_hoan_tien;
    const hasRefundAmount = Number(refundInfo?.so_tien_hoan || booking?.hoan_tien?.so_tien_hoan) > 0;

    if (refundStatus === 'da_hoan') {
      const meta = REFUND_BADGE.da_hoan;
      return {
        shortLabel: 'Đã hoàn',
        label: meta.label,
        cls: 'mgmt-status-text--active',
        badge: meta.cls,
      };
    }

    if (['cho_xu_ly', 'dang_xu_ly'].includes(refundStatus)) {
      const meta = REFUND_BADGE.cho_xu_ly;
      return {
        shortLabel: 'Chờ xử lý',
        label: meta.label,
        cls: 'mgmt-status-text--pending',
        badge: meta.cls,
      };
    }

    if (hasRefundAmount && !refundStatus) {
      const meta = REFUND_BADGE.cho_xu_ly;
      return {
        shortLabel: 'Chờ xử lý',
        label: meta.label,
        cls: 'mgmt-status-text--pending',
        badge: meta.cls,
      };
    }

    if (refundStatus === 'tu_choi') {
      const meta = REFUND_BADGE.tu_choi;
      return {
        shortLabel: 'Không hoàn',
        label: meta.label,
        cls: 'mgmt-status-text--danger',
        badge: meta.cls,
      };
    }

    const paidOnline = booking?.phuong_thuc_tt === 'truc_tuyen'
      || booking?.thanh_toan?.trang_thai === 'thanh_cong';
    if (paidOnline) {
      const meta = REFUND_BADGE.cho_xu_ly;
      return {
        shortLabel: 'Chờ xử lý',
        label: meta.label,
        cls: 'mgmt-status-text--pending',
        badge: meta.cls,
      };
    }

    return {
      shortLabel: 'Không hoàn',
      label: 'Không hoàn tiền',
      cls: 'mgmt-status-text--muted',
      badge: 'badge-default',
    };
  }

  if (isOnlinePaid(booking)) {
    return {
      shortLabel: 'Đã thanh toán',
      label: 'Đã thanh toán',
      cls: 'mgmt-status-text--active',
      badge: 'badge-success',
    };
  }

  if (booking?.phuong_thuc_tt === 'tai_khach_san') {
    return {
      shortLabel: 'Tại KS',
      label: 'Thanh toán tại khách sạn',
      cls: 'mgmt-status-text--pending',
      badge: 'badge-warning',
    };
  }

  return {
    shortLabel: 'Chờ TT',
    label: 'Chờ thanh toán',
    cls: 'mgmt-status-text--pending',
    badge: 'badge-warning',
  };
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN') : '—';

/** Đã qua ngày trả phòng — không còn check-in/check-out */
export const isBookingStayEnded = (checkoutDate) => {
  if (!checkoutDate) return false;
  const checkout = new Date(checkoutDate);
  const today = new Date();
  checkout.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return checkout < today;
};

export const canPartnerCheckIn = (booking) => (
  Boolean(booking)
  && ['da_xac_nhan', 'cho_xac_nhan'].includes(booking.trang_thai)
  && !isBookingStayEnded(booking.ngay_tra_phong)
);

export const canPartnerCheckOut = (booking) => (
  Boolean(booking)
  && booking.trang_thai === 'da_checkin'
  && !isBookingStayEnded(booking.ngay_tra_phong)
);

export const formatHotelTime = (time, fallback = '14:00') => {
  if (!time) return fallback;
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return fallback;
  // Giờ nhận/trả phòng lưu dạng TIME UTC — hiển thị HH:mm không cộng múi giờ
  return d.toISOString().slice(11, 16);
};

export const formatStayDateTime = (date, hotelTime, fallbackTime) => {
  if (!date) return '—';
  return {
    date: formatDate(date),
    time: formatHotelTime(hotelTime, fallbackTime),
  };
};

export const addDays = (date, days = 1) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const formatOrderTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${time} ${d.toLocaleDateString('vi-VN')}`;
};

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—';

export const diffDays = (from, to) => {
  const d = new Date(to) - new Date(from);
  return Math.ceil(d / (1000 * 60 * 60 * 24));
};
