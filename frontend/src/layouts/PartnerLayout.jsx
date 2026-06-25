import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarCheck,
  Tag,
  Percent,
  Wallet,
  Star,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import { isPartnerMenuActive } from '../utils/sidebarActive';
import PartnerNotificationBell from '../components/partner/PartnerNotificationBell';
import { resolveUploadUrl } from '../utils/media';

const partnerMenus = [
  { title: 'Tổng quan', path: '/partner/dashboard', icon: LayoutDashboard },
  { title: 'Khách sạn', path: '/partner/hotels', icon: Building2 },
  { title: 'Loại phòng', path: '/partner/rooms', icon: BedDouble },
  { title: 'Đặt phòng', path: '/partner/bookings', icon: CalendarCheck },
  { title: 'Quản lý giá', path: '/partner/pricing', icon: Tag },
  { title: 'Khuyến mãi', path: '/partner/promotions', icon: Percent },
  { title: 'Tài chính', path: '/partner/finance', icon: Wallet },
  { title: 'Đánh giá', path: '/partner/reviews', icon: Star },
  { title: 'Tài khoản', path: '/partner/account', icon: UserCircle },
];

const getInitials = (user) => {
  const name = user?.ho_ten || user?.email || 'P';
  return name.charAt(0).toUpperCase();
};

const PartnerLayout = () => {
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
            {partnerMenus.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-menu-item ${isPartnerMenuActive(location.pathname, item.path) ? 'active' : ''}`}
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
              <PartnerNotificationBell />

              <div className="admin-user-block">
                <div className="admin-user-text">
                  <div className="admin-user-name">{user?.ho_ten || user?.email?.split('@')[0] || 'đối tác'}</div>
                  <div className="admin-user-role">Đối tác</div>
                </div>
                <div className="admin-user-avatar">{getInitials(user)}</div>
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

export default PartnerLayout;
