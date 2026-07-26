

export const buildAdminHotelsListPath = (tab = 'all') => {
  if (!tab || tab === 'all') return '/admin/hotels';
  return `/admin/hotels?tab=${tab}`;
};

export const hotelStatusToListTab = (status) => {
  if (status === 'cho_duyet') return 'cho_duyet';
  if (status === 'hoat_dong' || status === 'da_duyet') return 'hoat_dong';
  if (status === 'tu_choi' || status === 'bi_khoa') return 'tu_choi';
  return 'all';
};

export const buildAdminUsersListPath = (tab = 'all') => {
  if (!tab || tab === 'all') return '/admin/users';
  return `/admin/users?tab=${tab}`;
};

export const userStatusToListTab = (status) => {
  if (status === 'hoat_dong') return 'hoat_dong';
  if (status === 'bi_khoa') return 'bi_khoa';
  return 'all';
};

export const buildAdminBookingsListPath = (tab = 'all') => {
  if (!tab || tab === 'all') return '/admin/bookings';
  return `/admin/bookings?tab=${tab}`;
};

export const bookingStatusToListTab = (status) => {
  if (['da_xac_nhan', 'da_checkin', 'hoan_thanh', 'da_huy'].includes(status)) {
    return status;
  }
  if (status === 'tu_choi') return 'da_huy';
  return 'all';
};
