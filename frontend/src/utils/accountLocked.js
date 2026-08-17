import { getLoginRouteFromPath } from './authPortal';
import { setFlashToast } from './flashToast';

const LOCKED_CODE = 'ACCOUNT_LOCKED';

const isAuthPath = (path) => path.startsWith('/login')
  || path.startsWith('/register')
  || path.startsWith('/forgot-password')
  || path === '/partner/login'
  || path === '/partner/forgot-password'
  || path === '/admin/login'
  || path === '/admin/forgot-password';

export const isAccountLockedResponse = (error) => {
  const data = error?.response?.data;
  if (error?.response?.status !== 403 || !data) return false;
  if (data.code === 'EMAIL_LOCKED') return false;
  return data.code === LOCKED_CODE;
};

export const handleAccountLockedResponse = (error) => {
  if (!isAccountLockedResponse(error)) return false;

  const message = error.response?.data?.message
    || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setFlashToast(message, 'error', 4000);

  const path = window.location.pathname;
  if (path !== '/' && !isAuthPath(path)) {
    window.location.href = getLoginRouteFromPath(path);
  }

  return true;
};

export default handleAccountLockedResponse;
