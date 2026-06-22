/** Xác định menu sidebar đang active (hỗ trợ route lồng nhau) */
export const isPartnerMenuActive = (pathname, path) => {
  if (pathname === path) return true;

  if (path === '/partner/hotels') {
    return pathname === '/partner/hotels/create'
      || /^\/partner\/hotels\/\d+(\/edit)?$/.test(pathname);
  }

  if (path === '/partner/rooms') {
    return pathname === '/partner/rooms'
      || /^\/partner\/hotels\/\d+\/rooms(\/|$)/.test(pathname);
  }

  if (path === '/partner/inventory') {
    return pathname.startsWith('/partner/inventory/');
  }

  if (path === '/partner/account') {
    return pathname.startsWith('/partner/account/');
  }

  const nestedPaths = ['/partner/bookings'];
  if (nestedPaths.includes(path) && pathname.startsWith(`${path}/`)) {
    return true;
  }

  return pathname.startsWith(`${path}/`);
};

export const isAdminMenuActive = (pathname, path) => {
  if (pathname === path) return true;

  const nestedMenuPaths = [
    '/admin/users',
    '/admin/hotels',
    '/admin/bookings',
    '/admin/amenities',
    '/admin/room-types',
  ];

  if (nestedMenuPaths.includes(path) && pathname.startsWith(`${path}/`)) {
    return true;
  }

  return false;
};
