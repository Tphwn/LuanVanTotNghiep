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
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <h2>
          <Link to={ROUTES.HOME} style={{ textDecoration: 'none', color: '#117d62' }}>
            🏨 Hotel Booking
          </Link>
        </h2>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '14px' }}>Chào, <strong>{user.ho_ten || user.email}</strong></span>
            <button onClick={handleLogout} style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#fff',
            }}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to={ROUTES.LOGIN}>
              <button style={{
                padding: '8px 16px',
                border: '1px solid #05604f',
                color: '#0aa176',
                borderRadius: '6px',
                cursor: 'pointer',
                background: '#fff',
              }}>Đăng nhập</button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <button style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: '#117d62',
                color: '#fff',
              }}>Đăng ký</button>
            </Link>
          </div>
        )}
      </header>

      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
};

export default MainLayout;