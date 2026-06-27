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
  da_huy: { label: 'Đã hủy', cls: 'mgmt-status-text--locked' },
  tu_choi: { label: 'Đã hủy', cls: 'mgmt-status-text--locked' },
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

export const isRefunded = (booking) => {
  if (!booking) return false;
  if (booking.hoan_tien?.trang_thai === 'da_hoan') return true;
  if (!isCancelledBooking(booking)) return false;
  return (
    booking.phuong_thuc_tt === 'truc_tuyen'
    || booking.thanh_toan?.trang_thai === 'thanh_cong'
  );
};

export const getPaymentDisplay = (booking) => {
  if (isRefunded(booking)) {
    return {
      shortLabel: 'Đã hoàn',
      label: 'Đã hoàn tiền',
      cls: 'mgmt-status-text--locked',
      badge: 'badge-default',
    };
  }

  if (isCancelledBooking(booking)) {
    return {
      shortLabel: '—',
      label: 'Không phát sinh',
      cls: 'mgmt-status-text--locked',
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

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—';

export const diffDays = (from, to) => {
  const d = new Date(to) - new Date(from);
  return Math.ceil(d / (1000 * 60 * 60 * 24));
};
