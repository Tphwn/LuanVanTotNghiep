import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

const adminMenus = [
  { icon: '📊', title: 'Dashboard',   path: '/admin/dashboard' },
  { icon: '👥', title: 'Người dùng',  path: '/admin/users' },
  { icon: '🏨', title: 'Khách sạn',   path: '/admin/hotels' },
  { icon: '🛏️', title: 'Đặt phòng',  path: '/admin/bookings' },
  { icon: '💳', title: 'Thanh toán',  path: '/admin/payments' },
  { icon: '🛎️', title: 'Tiện nghi',  path: '/admin/amenities' },
  { icon: '�️', title: 'Loại phòng',  path: '/admin/room-types' },
  { icon: '⭐', title: 'Đánh giá',   path: '/admin/reviews' },
  { icon: '💼', title: 'Tài chính',   path: '/admin/finance' },
  { icon: '📈', title: 'Báo cáo',     path: '/admin/reports' },
  
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <header className="layout-header">
        <div className="header-brand">
          {/* Hamburger — chỉ hiện trên mobile */}
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="brand-icon">🛡️</div>
          <div>
            <div className="brand-subtitle">Bảng điều khiển quản trị</div>
            <h2 className="brand-title">Hotel Booking</h2>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-user-text">
            <div className="header-smoke">Xin chào,</div>
            <div className="header-username">{user?.email || 'Admin'}</div>
          </div>
          <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
        </div>
      </header>

      <div className="layout-body">
        {/* Overlay tối khi sidebar mở trên mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

        <aside className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}>
          <p className="sidebar-label">Quản trị hệ thống</p>
          <h3 className="sidebar-title">Admin Panel</h3>
          {adminMenus.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </aside>

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;