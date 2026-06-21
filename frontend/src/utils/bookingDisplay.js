export const TRANG_THAI = {
  cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'badge-warning' },
  da_xac_nhan: { label: 'Đã xác nhận', cls: 'badge-info' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'badge-success' },
  da_huy: { label: 'Đã hủy', cls: 'badge-danger' },
  tu_choi: { label: 'Từ chối', cls: 'badge-danger' },
};

export const PHUONG_THUC = {
  truc_tuyen: ' Trực tuyến',
  tai_khach_san: 'Tại khách sạn',
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
