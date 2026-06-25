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
};

export const getAdminRoomTypeStatus = (status) =>
  ADMIN_ROOM_TYPE_STATUS[status] || {
    label: status || '—',
    textCls: '',
    badgeCls: 'badge-default',
  };
