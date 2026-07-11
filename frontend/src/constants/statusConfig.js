

const TONE = {
  success: { badge: 'badge-success', text: 'mgmt-status-text--active' },
  warning: { badge: 'badge-warning', text: 'mgmt-status-text--pending' },
  danger: { badge: 'badge-danger', text: 'mgmt-status-text--danger' },
  locked: { badge: 'badge-danger', text: 'mgmt-status-text--locked' },
  info: { badge: 'badge-info', text: 'mgmt-status-text--info' },
  muted: { badge: 'badge-default', text: 'mgmt-status-text--muted' },
};

const make = (label, tone) => ({ label, ...TONE[tone] });

// ── Đặt phòng ───────────────────────────────────────────────
export const BOOKING_STATUS = {
  cho_xac_nhan: make('Chờ check-in', 'info'),
  da_xac_nhan: make('Chờ check-in', 'info'),
  da_checkin: make('Đã check-in', 'info'),
  hoan_thanh: make('Hoàn thành', 'success'),
  da_huy: make('Đã hủy', 'danger'),
  tu_choi: make('Đã hủy', 'danger'),
};

// ── Khách sạn ───────────────────────────────────────────────
export const HOTEL_STATUS = {
  cho_duyet: make('Chờ duyệt', 'warning'),
  da_duyet: make('Đã duyệt', 'success'),
  hoat_dong: make('Đang hoạt động', 'success'),
  tu_choi: make('Từ chối', 'danger'),
  yeu_cau_sua: make('Yêu cầu sửa', 'warning'),
  bi_khoa: make('Tạm ngừng', 'locked'),
};

// ── Loại phòng ──────────────────────────────────────────────
export const ROOM_TYPE_STATUS = {
  hoat_dong: make('Đang hoạt động', 'success'),
  an: make('Đã ẩn', 'muted'),
};

// ── Đánh giá ────────────────────────────────────────────────
export const REVIEW_STATUS = {
  hien_thi: make('Hiển thị', 'success'),
  an: make('Đã ẩn', 'muted'),
};

// ── Hoàn tiền ───────────────────────────────────────────────
export const REFUND_STATUS = {
  cho_xu_ly: make('Chờ xử lý', 'warning'),
  dang_xu_ly: make('Đang xử lý', 'info'),
  da_hoan: make('Đã hoàn', 'success'),
  tu_choi: make('Từ chối', 'danger'),
};

// ── Tài khoản người dùng ────────────────────────────────────
export const ACCOUNT_STATUS = {
  hoat_dong: make('Đang hoạt động', 'success'),
  bi_khoa: make('Đã khóa', 'locked'),
};

const fallback = (key) => ({ label: key || '—', badge: 'badge-default', text: 'mgmt-status-text--muted' });

/** Lấy meta dạng badge (pill nền màu): { label, cls } */
export const badgeMeta = (map, key) => {
  const meta = map[key] || fallback(key);
  return { label: meta.label, cls: meta.badge };
};

/** Lấy meta dạng text màu (list quản lý): { label, cls } */
export const textMeta = (map, key) => {
  const meta = map[key] || fallback(key);
  return { label: meta.label, cls: meta.text };
};

/** Dựng map { key: { label, cls } } sẵn cho từng biến thể để dùng trực tiếp tại call site */
const buildMap = (source, variant) => Object.fromEntries(
  Object.keys(source).map((key) => [
    key,
    variant === 'text' ? textMeta(source, key) : badgeMeta(source, key),
  ]),
);

export const HOTEL_BADGE = buildMap(HOTEL_STATUS, 'badge');
export const HOTEL_TEXT = buildMap(HOTEL_STATUS, 'text');
export const ROOM_TYPE_BADGE = buildMap(ROOM_TYPE_STATUS, 'badge');
export const ROOM_TYPE_TEXT = buildMap(ROOM_TYPE_STATUS, 'text');
export const REVIEW_BADGE = buildMap(REVIEW_STATUS, 'badge');
export const REVIEW_TEXT = buildMap(REVIEW_STATUS, 'text');
export const ACCOUNT_BADGE = buildMap(ACCOUNT_STATUS, 'badge');
export const ACCOUNT_TEXT = buildMap(ACCOUNT_STATUS, 'text');

export const getHotelStatusMeta = (hotel, { variant = 'badge' } = {}) => {
  const status = hotel?.trang_thai;
  if (status === 'bi_khoa') {
    const adminLocked = !hotel?.khoa_do_doi_tac;
    const label = adminLocked ? 'Đã khóa' : 'Tạm ngừng';
    return {
      label,
      cls: variant === 'text' ? TONE.locked.text : TONE.locked.badge,
    };
  }
  return variant === 'text'
    ? textMeta(HOTEL_STATUS, status)
    : badgeMeta(HOTEL_STATUS, status);
};
