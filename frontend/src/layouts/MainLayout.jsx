import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';
import { resolveUploadUrl } from '../utils/media';
import CustomerUserMenu from '../components/customer/CustomerUserMenu';
import FlashToastHost from '../components/common/FlashToastHost';
import SiteFooter from '../components/layout/SiteFooter';

const AUTH_FOOTER_HIDDEN = new Set([
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
]);

const MainLayout = ({ children, fullBleed = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Website khách chỉ hiện session khách hàng; admin/đối tác xem như khách chưa đăng nhập
  const isCustomerSession = user?.vai_tro === ROLES.KHACH_HANG;
  const showFooter = !AUTH_FOOTER_HIDDEN.has(location.pathname);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.HOME, { replace: true });
  };
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === ROUTES.CUSTOMER.HOTELS) {
      return location.pathname === ROUTES.CUSTOMER.HOTELS;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="app-shell">
      <FlashToastHost />
      <header className="layout-header">
      <Link to={ROUTES.HOME} className="header-brand" style={{ textDecoration: 'none' }}>
          <img
            src={resolveUploadUrl('/uploads/logo.png')}
            alt="Hotel Booking"
            className="header-brand-logo"
          />
        </Link>

        <nav className="header-nav">
        <Link
            to={ROUTES.HOME}
            className={`header-nav-link${isActive(ROUTES.HOME) ? ' active' : ''}`}
          >
             Trang chủ
          </Link>
          <Link
            to={ROUTES.CUSTOMER.HOTELS}
            className={`header-nav-link${isActive(ROUTES.CUSTOMER.HOTELS) ?' active':''}`}
          >
             Khách sạn
          </Link>
          <Link
            to={ROUTES.CUSTOMER.CONTACT}
            className={`header-nav-link${isActive(ROUTES.CUSTOMER.CONTACT) ? ' active' : ''}`}
          >
            Liên hệ
          </Link>
          <Link
            to={ROUTES.CUSTOMER.PARTNER_CONTACT}
            className={`header-nav-link${isActive(ROUTES.CUSTOMER.PARTNER_CONTACT) ? ' active' : ''}`}
          >
            <span className="header-nav-text-full">Hợp tác với chúng tôi</span>
            <span className="header-nav-text-short">Hợp tác</span>
          </Link>
        </nav>

        <div className="header-actions">
          {isCustomerSession ? (
            <CustomerUserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>
                <button
                  type="button"
                  className={`logout-button${isActive(ROUTES.LOGIN) ? ' active' : ''}`}
                >
                  Đăng nhập
                </button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <button
                  type="button"
                  className={`header-register-btn${isActive(ROUTES.REGISTER) ? ' active' : ''}`}
                >
                  Đăng ký
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={fullBleed ? 'main-panel-full' : 'main-panel'}>{children}</main>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
};

export default MainLayout;
