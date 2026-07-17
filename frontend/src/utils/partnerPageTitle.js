const PARTNER_PAGE_TITLES = [
  { prefix: '/partner/dashboard', title: 'Tổng quan' },
  { prefix: '/partner/hotels', title: 'Khách sạn' },
  { prefix: '/partner/rooms', title: 'Loại phòng' },
  { prefix: '/partner/bookings', title: 'Đặt phòng' },
  { prefix: '/partner/pricing', title: 'Quản lý giá và kho phòng' },
  { prefix: '/partner/promotions', title: 'Khuyến mãi' },
  { prefix: '/partner/finance/payouts', title: 'Chi tiết thanh toán' },
  { prefix: '/partner/finance', title: 'Tài chính' },
  { prefix: '/partner/reviews', title: 'Đánh giá' },
  { prefix: '/partner/account', title: 'Tài khoản' },
  { prefix: '/partner/images', title: 'Hình ảnh' },
];

export const getPartnerPageTitle = (pathname) => {
  const match = PARTNER_PAGE_TITLES.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );
  return match?.title || 'Đối tác';
};

export default getPartnerPageTitle;
