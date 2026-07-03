export const ADMIN_ROOM_TYPE_STATUS = {
  hoat_dong: {
    label: 'Đang mở',
    textCls: 'mgmt-status-text--active',
    badgeCls: 'badge-success',
  },
  an: {
    label: 'Đã ẩn',
    textCls: 'mgmt-status-text--locked',
    badgeCls: 'badge-warning',
  },
  bi_khoa: {
    label: 'Bị khóa',
    textCls: 'mgmt-status-text--locked',
    badgeCls: 'badge-danger',
  },
};

export const getAdminRoomTypeStatus = (status, options = {}) => {
  const { hotelStatus } = options;
  if (hotelStatus === 'bi_khoa') {
    return ADMIN_ROOM_TYPE_STATUS.bi_khoa;
  }
  return ADMIN_ROOM_TYPE_STATUS[status] || {
    label: status || '—',
    textCls: '',
    badgeCls: 'badge-default',
  };
};
