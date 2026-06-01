import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

const adminMenus = [
  { title: 'Dashboard', path: '/admin/dashboard' },
  { title: 'Người dùng', path: '/admin/users' },
  { title: 'Khách sạn', path: '/admin/hotels' },
  { title: 'Đặt phòng', path: '/admin/bookings' },
  { title: 'Thanh toán', path: '/admin/payments' },
  { title: 'Báo cáo', path: '/admin/reports' },
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff' }}>
      <header
        style={{
          height: '80px',
          background: '#0f172a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          boxShadow: '0 5px 18px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', background: '#7c3aed', borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Admin Panel</div>
            <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Hotel Booking</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Xin chào,</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.ho_ten || user?.email || 'Admin'}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', padding: '1.75rem 2rem', gap: '22px' }}>
        <aside
          style={{
            width: '260px',
            background: '#fff',
            borderRadius: '28px',
            border: '1px solid rgba(15, 23, 42, 0.06)',
            padding: '20px',
            boxShadow: '0 14px 40px rgba(15, 23, 42, 0.05)',
            minHeight: 'calc(100vh - 104px)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Bảng điều khiển</p>
            <h3 style={{ margin: '10px 0 0', fontSize: '1.15rem', color: '#0f172a' }}>Admin Menu</h3>
          </div>
          {adminMenus.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '14px 16px',
                marginBottom: '10px',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: 600,
                color: location.pathname === item.path ? '#fff' : '#334155',
                background: location.pathname === item.path ? '#7c3aed' : '#f8fafc',
                transition: 'all 0.2s ease',
              }}
            >
              {item.title}
            </Link>
          ))}
        </aside>

        <main
          style={{
            flex: 1,
            borderRadius: '28px',
            padding: '24px',
            background: '#fff',
            boxShadow: '0 14px 40px rgba(15, 23, 42, 0.05)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;