import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarCheck,
  Tag,
  Package,
  Wallet,
  Star,
  UserCircle,
} from 'lucide-react';
import { isPartnerMenuActive } from '../../utils/sidebarActive';

const partnerMenus = [
  { name: 'Tổng quan', path: '/partner/dashboard', icon: LayoutDashboard },
  { name: 'Khách sạn', path: '/partner/hotels', icon: Building2 },
  { name: 'Loại phòng', path: '/partner/rooms', icon: BedDouble },
  { name: 'Đặt phòng', path: '/partner/bookings', icon: CalendarCheck },
  { name: 'Quản lý giá', path: '/partner/pricing', icon: Tag },
  { name: 'Kho phòng', path: '/partner/inventory', icon: Package },
  { name: 'Tài chính', path: '/partner/finance', icon: Wallet },
  { name: 'Đánh giá', path: '/partner/reviews', icon: Star },
  { name: 'Tài khoản', path: '/partner/account', icon: UserCircle },
];

const PartnerSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
      <p className="sidebar-label">Quản lý đối tác</p>
      <h3 className="sidebar-title">Partner Panel</h3>
      {partnerMenus.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-menu-item ${isPartnerMenuActive(location.pathname, item.path) ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={18} className="sidebar-menu-icon" strokeWidth={2} />
            {item.name}
          </Link>
        );
      })}
    </aside>
  );
};

export default PartnerSidebar;
