import { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';

import {

  LayoutDashboard,

  Users,

  Building2,

  CalendarCheck,

  CreditCard,

  Sparkles,

  BedDouble,

  Star,

  Wallet,

  FileBarChart,

} from 'lucide-react';

import { logout } from '../store/slices/authSlice';
import ROUTES from '../constants/routes';
import { isAdminMenuActive } from '../utils/sidebarActive';



const adminMenus = [

  { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },

  { title: 'Người dùng', path: '/admin/users', icon: Users },

  { title: 'Khách sạn', path: '/admin/hotels', icon: Building2 },

  { title: 'Đặt phòng', path: '/admin/bookings', icon: CalendarCheck },

  { title: 'Thanh toán', path: '/admin/payments', icon: CreditCard },

  { title: 'Tiện nghi', path: '/admin/amenities', icon: Sparkles },

  { title: 'Loại phòng', path: '/admin/room-types', icon: BedDouble },

  { title: 'Đánh giá', path: '/admin/reviews', icon: Star },

  { title: 'Tài chính', path: '/admin/finance', icon: Wallet },

  { title: 'Báo cáo', path: '/admin/reports', icon: FileBarChart },

];



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

    <div className="app-shell">

      <header className="layout-header">

        <div className="header-brand">

          <button type="button" className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>

            <span /><span /><span />

          </button>

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

          <button type="button" onClick={handleLogout} className="logout-button">Đăng xuất</button>

        </div>

      </header>



      <div className="layout-body">

        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}



        <aside className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}>

          <p className="sidebar-label">Quản trị hệ thống</p>

          <h3 className="sidebar-title">Admin Panel</h3>

          {adminMenus.map((item) => {

            const Icon = item.icon;

            return (

              <Link

                key={item.path}

                to={item.path}

                className={`sidebar-menu-item ${isAdminMenuActive(location.pathname, item.path) ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={18} className="sidebar-menu-icon" strokeWidth={2} />
                {item.title}
              </Link>
            );
          })}
        </aside>

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
