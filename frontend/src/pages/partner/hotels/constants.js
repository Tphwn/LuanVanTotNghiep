export const TRANG_THAI = {
  cho_duyet: { label: 'Chờ duyệt', cls: 'mgmt-status-text--pending' },
  da_duyet: { label: 'Đã duyệt', cls: 'mgmt-status-text--active' },
  hoat_dong: { label: 'Đang hoạt động', cls: 'mgmt-status-text--active' },
  tu_choi: { label: 'Từ chối', cls: 'mgmt-status-text--locked' },
  yeu_cau_sua: { label: 'Cần sửa', cls: 'mgmt-status-text--pending' },
  bi_khoa: { label: 'Tạm ngừng', cls: 'mgmt-status-text--locked' },
};

export const TAB_FILTER = {
  all: () => true,
  da_duyet: (h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai),
  cho_duyet: (h) => h.trang_thai === 'cho_duyet',
  tu_choi: (h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai),
};

export const getLoaiHinh = (hotel) => {
  const sao = hotel.so_sao || 0;
  if (sao >= 5) return 'Khu nghỉ dưỡng';
  if (sao >= 3) return 'Khách sạn';
  return 'Homestay';
};
