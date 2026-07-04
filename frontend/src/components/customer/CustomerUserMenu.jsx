import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Calendar,
  RotateCcw,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import ROUTES from '../../constants/routes';
import { getGivenName, resolveHoTen } from '../../utils/userDisplay';

const menuItems = [
  { label: 'Chỉnh sửa hồ sơ', path: ROUTES.CUSTOMER.PROFILE, icon: User },
  { label: 'Đặt chỗ của tôi', path: ROUTES.CUSTOMER.MY_BOOKINGS, icon: Calendar },
  { label: 'Hoàn tiền', path: ROUTES.CUSTOMER.REFUNDS, icon: RotateCcw },
];

const CustomerUserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const hoTen = resolveHoTen(user);
  const givenName = getGivenName(hoTen);
  const displayName = hoTen || user?.email || 'Khách';
  const shortName = givenName || user?.email?.split('@')[0] || 'Khách';
  const avatarLetter = (givenName?.[0] || hoTen?.[0] || user?.email?.[0] || 'K').toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <div className="customer-user-menu" ref={ref}>
      <button
        type="button"
        className="customer-user-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="customer-user-avatar">{avatarLetter}</span>
        <span className="customer-user-trigger-name">{shortName}</span>
        <ChevronDown size={16} className={open ? 'customer-user-chevron-open' : ''} />
      </button>

      {open && (
        <div className="customer-user-dropdown">
          <div className="customer-user-dropdown-header">
            <strong>{displayName}</strong>
            <span>Thành viên</span>
          </div>

          <div className="customer-user-dropdown-body">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="customer-user-dropdown-item"
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              className="customer-user-dropdown-item customer-user-dropdown-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerUserMenu;
