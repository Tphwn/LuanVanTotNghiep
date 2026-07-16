import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';
import getRedirectRoute from '../utils/redirect';
import { resolveUploadUrl } from '../utils/media';
import CustomerUserMenu from '../components/customer/CustomerUserMenu';
const MainLayout = ({ children, fullBleed = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

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
          {user?.vai_tro === ROLES.KHACH_HANG ? (
            <CustomerUserMenu user={user} onLogout={handleLogout} />
          ) : user ? (
            <>
            <div className="header-user-text">
              <div className="header-smoke">Xin chào</div>
              <div className="header-username">{user.ho_ten || user.email}</div>
              </div>
              <button type="button"className="logout-button"onClick={() => navigate(getRedirectRoute(user))}>
                Bảng điều khiển
              </button>
              <button type="button"className="logout-button"onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
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

      <main className={fullBleed ? 'main-panel-full':'main-panel'}>{children}</main>
    </div>
  );
};

export default MainLayout;
