export const TRANG_THAI = {
  cho_xac_nhan: { label: 'Chờ check-in', cls: 'badge-info' },
  da_xac_nhan: { label: 'Chờ check-in', cls: 'badge-info' },
  da_checkin: { label: 'Đã check-in', cls: 'badge-info' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'badge-success' },
  da_huy: { label: 'Đã hủy', cls: 'badge-danger' },
  tu_choi: { label: 'Đã hủy', cls: 'badge-danger' },
};

export const PARTNER_TRANG_THAI = {
  cho_xac_nhan: { label: 'Chờ check-in', cls: 'mgmt-status-text--info' },
  da_xac_nhan: { label: 'Chờ check-in', cls: 'mgmt-status-text--info' },
  da_checkin: { label: 'Đã check-in', cls: 'mgmt-status-text--info' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'mgmt-status-text--active' },
  da_huy: { label: 'Đã hủy', cls: 'mgmt-status-text--danger' },
  tu_choi: { label: 'Đã hủy', cls: 'mgmt-status-text--danger' },
};

export const PHUONG_THUC = {
  truc_tuyen: 'Trực tuyến',
  tai_khach_san: 'Tại khách sạn',
};

export const isCancelledBooking = (booking) =>
  ['da_huy', 'tu_choi'].includes(booking?.trang_thai);

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
      return {
        shortLabel: '✓ Đã hoàn',
        label: 'Đã hoàn tiền',
        cls: 'mgmt-status-text--active',
        badge: 'badge-success',
      };
    }

    if (['cho_xu_ly', 'dang_xu_ly'].includes(refundStatus) || (hasRefundAmount && !refundStatus)) {
      return {
        shortLabel: '⏳ Đang hoàn',
        label: 'Đang hoàn tiền',
        cls: 'mgmt-status-text--pending',
        badge: 'badge-warning',
      };
    }

    if (refundStatus === 'tu_choi') {
      return {
        shortLabel: 'Không hoàn',
        label: 'Từ chối hoàn tiền',
        cls: 'mgmt-status-text--danger',
        badge: 'badge-danger',
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
      shortLabel: 'Đã TT',
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
