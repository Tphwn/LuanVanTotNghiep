const ADMIN_PAGE_TITLES = [
  { prefix: '/admin/dashboard', title: 'Dashboard' },
  { prefix: '/admin/users', title: 'Người dùng' },
  { prefix: '/admin/hotels', title: 'Khách sạn' },
  { prefix: '/admin/bookings', title: 'Đặt phòng' },
  { prefix: '/admin/amenities', title: 'Tiện nghi' },
  { prefix: '/admin/room-types', title: 'Loại phòng' },
  { prefix: '/admin/reviews', title: 'Đánh giá' },
  { prefix: '/admin/finance', title: 'Tài chính' },
  { prefix: '/admin/reports', title: 'Báo cáo' },
  { prefix: '/admin/partners', title: 'Đối tác' },
];

export const getAdminPageTitle = (pathname) => {
  const match = ADMIN_PAGE_TITLES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return match?.title || 'Quản trị';
};

export default getAdminPageTitle;
