import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { ROUTES } from '../constants/routes';

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
        borderBottom: '1px solid #f0f0f0'
      }}>
        <h1><Link to={ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit' }}>Hotel Booking</Link></h1>

        {user ? (
          // Khi người dùng đã đăng nhập
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Chào, {user.ho_ten || user.email}</span>
            <button onClick={handleLogout} style={{ padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}>
              Đăng xuất
            </button>
          </div>
        ) : (
          // Khi người dùng chưa đăng nhập
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to={ROUTES.LOGIN}>
              <button style={{ padding: '8px 16px', border: '1px solid #1677ff', color: '#1677ff', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}>
                Đăng nhập
              </button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <button style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#1677ff', color: '#fff' }}>
                Đăng ký
              </button>
            </Link>
          </div>
        )}

      </header>
      <main>{children}</main>
    </div>
  );
};
export default MainLayout;