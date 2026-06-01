import { Link, useLocation } from 'react-router-dom';

const PartnerSidebar = () => {
  const location = useLocation();

  const menus = [
    {
      name: 'Tổng quan',
      path: '/partner/dashboard',
    },
    {
      name: 'Khách sạn',
      path: '/partner/hotels',
    },
    {
      name: 'Loại phòng',
      path: '/partner/rooms',
    },
    {
      name: 'Đặt phòng',
      path: '/partner/bookings',
    },
    {
      name: 'Tiện nghi',
      path: '/partner/amenities',
    },
    {
      name: 'Hình ảnh',
      path: '/partner/images',
    },
    {
      name: 'Tài khoản',
      path: '/partner/account',
    },
  ];

  return (
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
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Điều hướng</p>
        <h3 style={{ margin: '10px 0 0', fontSize: '1.15rem', color: '#0f172a' }}>Partner Menu</h3>
      </div>

      {menus.map((item) => (
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
            background: location.pathname === item.path ? '#117d62' : '#f8fafc',
            transition: 'all 0.2s ease',
          }}
        >
          {item.name}
        </Link>
      ))}
    </aside>
  );
};

export default PartnerSidebar;