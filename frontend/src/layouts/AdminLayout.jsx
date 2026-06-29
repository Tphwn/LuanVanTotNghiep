import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Sparkles,
  BedDouble,
  Star,
  Wallet,
  FileBarChart,
  Handshake,
  Bell,
  LogOut,
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import { isAdminMenuActive } from '../utils/sidebarActive';
import { resolveUploadUrl } from '../utils/media';

const adminMenus = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Người dùng', path: '/admin/users', icon: Users },
  { title: 'Khách sạn', path: '/admin/hotels', icon: Building2 },
  { title: 'Đặt phòng', path: '/admin/bookings', icon: CalendarCheck },
  { title: 'Tiện nghi', path: '/admin/amenities', icon: Sparkles },
  { title: 'Loại phòng', path: '/admin/room-types', icon: BedDouble },
  { title: 'Đánh giá', path: '/admin/reviews', icon: Star },
  { title: 'Tài chính', path: '/admin/finance', icon: Wallet },
  { title: 'Báo cáo', path: '/admin/reports', icon: FileBarChart },
  { title: 'Hợp tác', path: '/admin/partner-requests', icon: Handshake },
];

const getInitials = (email) => {
  if (!email) return 'A';
  return email.charAt(0).toUpperCase();
};

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.HOME, { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell app-shell-admin">
      <div className="layout-body layout-body-admin">
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

        <aside className={`sidebar-panel sidebar-panel-admin ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <img
              src={resolveUploadUrl('/uploads/logo.png')}
              alt="Hotel Booking"
              className="sidebar-brand-logo-img"
            />
          </div>

          <div className="sidebar-section-label">Menu chính</div>

          <nav className="sidebar-nav sidebar-nav-admin">
            {adminMenus.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-menu-item ${isAdminMenuActive(location.pathname, item.path) ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon size={18} className="sidebar-menu-icon" strokeWidth={1.8} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button type="button" className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="admin-content-wrap">
          <header className="admin-topbar">
            <button
              type="button"
              className="hamburger hamburger-admin"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Mở menu"
            >
              <span /><span /><span />
            </button>

            <div className="admin-topbar-actions">
              <button type="button" className="admin-notify-btn" aria-label="Thông báo">
                <Bell size={20} strokeWidth={1.8} />
                <span className="admin-notify-dot" />
              </button>

              <div className="admin-user-block">
                <div className="admin-user-text">
                  <div className="admin-user-name">{user?.email?.split('@')[0] || 'admin'}</div>
                  <div className="admin-user-role">Quản trị viên</div>
                </div>
                <div className="admin-user-avatar">{getInitials(user?.email)}</div>
              </div>
            </div>
          </header>

          <main className="main-panel main-panel-admin">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
