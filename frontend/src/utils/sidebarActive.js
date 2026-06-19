/** Xác định menu sidebar đang active (hỗ trợ route lồng nhau) */
export const isPartnerMenuActive = (pathname, path) => {
  if (path === '/partner/rooms') {
    return pathname === '/partner/rooms' || /^\/partner\/hotels\/[^/]+\/rooms\/?$/.test(pathname);
  }
  if (path === '/partner/hotels') {
    return pathname === '/partner/hotels';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
};

export const isAdminMenuActive = (pathname, path) => {
  if (pathname === path) return true;
  if (path === '/admin/hotels' && pathname.startsWith('/admin/hotels/')) return true;
  if (path === '/admin/users' && pathname.startsWith('/admin/users/')) return true;
  if (path === '/admin/room-types' && pathname.startsWith('/admin/room-types/')) return true;
  return false;
};
