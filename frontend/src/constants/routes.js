const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CUSTOMER: {
    HOTELS: '/hotels',
    HOTEL_DETAIL: '/hotels/:id',
    ROOM_DETAIL: '/hotels/:hotelId/rooms/:roomId',
    BOOKING: '/booking',
    MY_BOOKINGS: '/my-bookings',
    PROMOTIONS: '/promotions',
    CONTACT: '/contact',
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