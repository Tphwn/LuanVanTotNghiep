import { Link, useLocation } from 'react-router-dom';

const partnerMenus = [
  { icon: '📊', name: 'Tổng quan',  path: '/partner/dashboard' },
  { icon: '🏨', name: 'Khách sạn', path: '/partner/hotels' },
  { icon: '🛏️', name: 'Loại phòng', path: '/partner/rooms' },
  { icon: '📅', name: 'Đặt phòng', path: '/partner/bookings' },
  { icon: '⭐', name: 'Đánh giá',   path: '/partner/reviews' },
  { icon: '💼', name: 'Tài chính',  path: '/partner/finance' },
  { icon: '🖼️', name: 'Hình ảnh',  path: '/partner/images' },
  { icon: '👤', name: 'Tài khoản', path: '/partner/account' },
];

const PartnerSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
      <p className="sidebar-label">Quản lý đối tác</p>
      <h3 className="sidebar-title">Partner Panel</h3>
      {partnerMenus.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="menu-icon">{item.icon}</span>
          {item.name}
        </Link>
      ))}
    </aside>
  );
};

export default PartnerSidebar;