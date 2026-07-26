import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';

export const SHARED_LOGIN_ROLES = [ROLES.KHACH_HANG, ROLES.DOI_TAC];

export const getLoginRouteByRole = (vaiTro) => {
  if (vaiTro === ROLES.ADMIN) return ROUTES.ADMIN.LOGIN;
  return ROUTES.LOGIN;
};

export const getForgotPasswordRouteByRole = (vaiTro) => {
  if (vaiTro === ROLES.ADMIN) return ROUTES.ADMIN.FORGOT_PASSWORD;
  return ROUTES.FORGOT_PASSWORD;
};

export const getLoginRouteByAllowedRoles = (allowedRoles = []) => {
  if (allowedRoles.length === 1 && allowedRoles[0] === ROLES.ADMIN) {
    return ROUTES.ADMIN.LOGIN;
  }
  return ROUTES.LOGIN;
};

export const getLoginRouteFromPath = (pathname = '') => {
  if (pathname.startsWith('/admin')) return ROUTES.ADMIN.LOGIN;
  return ROUTES.LOGIN;
};

export const PORTAL_COPY = {
  shared: {
    title: 'Đăng nhập',
    subtitle: 'Chào mừng trở lại Hotel Booking',
    forgotHint: 'Nhập email tài khoản khách hàng hoặc đối tác để nhận mã OTP',
  },
  [ROLES.ADMIN]: {
    title: 'Đăng nhập quản trị',
    subtitle: 'Cổng quản trị hệ thống Hotel Booking',
    forgotHint: 'Nhập email tài khoản quản trị để nhận mã OTP',
  },
};
