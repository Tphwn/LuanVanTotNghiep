import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Calendar, RotateCcw } from 'lucide-react';
import ROUTES from '../../../constants/routes';
import customerAccountService from '../../../services/customerAccountService';
import { resolveUploadUrl } from '../../../utils/media';
import { getGivenName } from '../../../utils/userDisplay';

export const CUSTOMER_PROFILE_UPDATED = 'customer-profile-updated';

const formatDate = (date) => (date ? new Date(date).toLocaleString('vi-VN') : '—');

const items = [
  { to: ROUTES.CUSTOMER.PROFILE, label: 'Chỉnh sửa hồ sơ', icon: User },
  { to: ROUTES.CUSTOMER.MY_BOOKINGS, label: 'Đặt chỗ của tôi', icon: Calendar },
  { to: ROUTES.CUSTOMER.REFUNDS, label: 'Hoàn tiền', icon: RotateCcw },
];

const CustomerAccountSidebar = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await customerAccountService.getProfile();
      setProfile(res.data?.data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    const handleUpdate = () => loadProfile();
    window.addEventListener(CUSTOMER_PROFILE_UPDATED, handleUpdate);
    return () => window.removeEventListener(CUSTOMER_PROFILE_UPDATED, handleUpdate);
  }, []);

  const avatarUrl = profile?.anh_dai_dien ? resolveUploadUrl(profile.anh_dai_dien) : null;
  const givenName = getGivenName(profile?.ho_ten);
  const avatarLetter = (givenName?.[0] || profile?.ho_ten?.[0] || 'K').toUpperCase();

  return (
    <aside className="account-sidebar">
      <div className="account-sidebar-profile">
        <div className="customer-avatar customer-avatar-sidebar">
          {loading ? (
            <span>…</span>
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <span>{avatarLetter}</span>
          )}
        </div>

        <div className="customer-profile-info customer-profile-info-sidebar">
          <h2>{profile?.ho_ten || 'Khách hàng'}</h2>
          <p>{profile?.email_dang_ky || profile?.email}</p>
          <span>Đăng nhập lần cuối: {formatDate(profile?.dang_nhap_cuoi)}</span>
        </div>
      </div>

      <nav className="account-sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `account-sidebar-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default CustomerAccountSidebar;
