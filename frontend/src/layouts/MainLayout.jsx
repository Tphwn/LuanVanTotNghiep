import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';
import getRedirectRoute from '../utils/redirect';

const MainLayout = ({ children, fullBleed = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.HOME, { replace: true });
  };

  const isMyBookings = location.pathname === ROUTES.CUSTOMER.MY_BOOKINGS;
  const isPromotions = location.pathname === ROUTES.CUSTOMER.PROMOTIONS;
  const isContact = location.pathname === ROUTES.CUSTOMER.CONTACT;

  return (
    <div className="app-shell">
      <header className="layout-header">
        <Link to={ROUTES.HOME} className="header-brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">🏨</div>
          <div>
            <div className="brand-subtitle">Hotel Booking</div>
            <span className="brand-title">Đặt phòng khách sạn</span>
          </div>
        </Link>

        <nav className="header-nav">
          <Link
            to={ROUTES.CUSTOMER.PROMOTIONS}
            className={`header-nav-link${isPromotions ? ' active' : ''}`}
          >
            🎁 Ưu đãi
          </Link>
          <Link
            to={ROUTES.CUSTOMER.CONTACT}
            className={`header-nav-link${isContact ? ' active' : ''}`}
          >
            <span className="header-nav-text-full">📞 Liên hệ với chúng tôi</span>
            <span className="header-nav-text-short">📞 Liên hệ</span>
          </Link>
        </nav>

        <div className="header-actions">
          {user?.vai_tro === ROLES.KHACH_HANG && (
            <Link
              to={ROUTES.CUSTOMER.MY_BOOKINGS}
              className={`header-nav-link${isMyBookings ? ' active' : ''}`}
              style={{ marginRight: 4 }}
            >
              📋 Đặt chỗ của tôi
            </Link>
          )}

          {user ? (
            <>
              <div className="header-user-text">
                <div className="header-smoke">Xin chào</div>
                <div className="header-username">{user.ho_ten || user.email}</div>
              </div>
              {user.vai_tro !== ROLES.KHACH_HANG && (
                <button
                  type="button"
                  className="logout-button"
                  onClick={() => navigate(getRedirectRoute(user))}
                >
                  Bảng điều khiển
                </button>
              )}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>
                <button type="button" className="logout-button">Đăng nhập</button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#fff',
                    color: '#3C7363',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đăng ký
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={fullBleed ? 'main-panel-full' : 'main-panel'}>{children}</main>
    </div>
  );
};

export default MainLayout;
