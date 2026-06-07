import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div>
      <header className="layout-header" style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 className="brand-heading">
          <Link to={ROUTES.HOME} className="brand-link">
            🏨 Hotel Booking
          </Link>
        </h2>

        {user ? (
          <div className="header-actions">
            <span className="header-greeting">Chào, <strong>{user.ho_ten || user.email}</strong></span>
            <button onClick={handleLogout} className="action-button outline-button">
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="header-actions">
            <Link to={ROUTES.LOGIN}>
              <button className="action-button outline-button">Đăng nhập</button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <button className="action-button solid-button">Đăng ký</button>
            </Link>
          </div>
        )}
      </header>

      <main className="page-main" style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
};

export default MainLayout;