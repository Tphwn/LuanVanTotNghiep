import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';

import PartnerSidebar from '../components/layout/PartnerSidebar';

const PartnerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f6f9' }}>
      {/* Header */}
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
          <div style={{ width: '42px', height: '42px', background: '#10b981', borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
            🏨
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Partner Admin</div>
            <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Hotel Booking</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.95rem' }}>Xin chào,</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.ho_ten || 'Đối tác'}</div>
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

      {/* Body */}
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 80px)',
          padding: '1.75rem 2rem',
          gap: '22px',
        }}
      >
        <PartnerSidebar />

        <main
          style={{
            flex: 1,
            borderRadius: '28px',
            padding: '24px',
            background: '#eef2ff',
            boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.03)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerLayout;