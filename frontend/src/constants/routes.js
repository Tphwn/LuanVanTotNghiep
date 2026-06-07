const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CUSTOMER: {
    HOTELS: '/hotels',
    HOTEL_DETAIL: '/hotels/:id',
    BOOKING: '/booking',
    MY_BOOKINGS: '/my-bookings',
    PROFILE: '/profile',
  },
  PARTNER: {
    DASHBOARD: '/partner/dashboard',
    HOTELS: '/partner/hotels',
    ROOMS: '/partner/rooms',
    BOOKINGS: '/partner/bookings',
    REVIEWS: '/partner/reviews',
    FINANCE: '/partner/finance',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    HOTELS: '/admin/hotels',
    BOOKINGS: '/admin/bookings',
    PAYMENTS: '/admin/payments',
    AMENITIES: '/admin/amenities',
    ROOM_TYPES: '/admin/room-types',
    REVIEWS: '/admin/reviews',
    FINANCE: '/admin/finance',
    REPORTS: '/admin/reports',
  },
};

export default ROUTES;