import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import PartnerSidebar from '../components/layout/PartnerSidebar';
import PartnerNotificationBell from '../components/partner/PartnerNotificationBell';

const PartnerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="layout-header">
        <div className="header-brand">
          <div>
            <div className="brand-subtitle">Quản trị viên đối tác</div>
            <h2 className="brand-title">Hotel Booking</h2>
          </div>
        </div>
        <div className="header-actions">
          <PartnerNotificationBell />
          <div className="header-user-text">
            <div className="header-smoke">Xin chào,</div>
            <div className="header-username">{user?.ho_ten || user?.email || 'Đối tác'}</div>
          </div>
          <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
        </div>
      </header>

      {/* Body */}
      <div className="layout-body">
        <PartnerSidebar />
        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerLayout;