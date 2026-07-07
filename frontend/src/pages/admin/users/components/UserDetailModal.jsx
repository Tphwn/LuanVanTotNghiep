import { useEffect, useState } from 'react';
import adminUserService from '../../../../services/adminUserService';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);

const formatDate = (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '—');

const getNameInitial = (name) => {
  if (!name || name === 'Chưa cập nhật') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const word = parts[parts.length - 1] || parts[0];
  return word[0]?.toUpperCase() || '?';
};

const ACCOUNT_STATUS = {
  hoat_dong: 'Hoạt động',
  bi_khoa: 'Bị khóa',
};

const PARTNER_STATUS = {
  hoat_dong: 'Đang hợp tác',
  bi_khoa: 'Ngưng hợp tác',
};

const InfoLine = ({ label, value }) => (
  <p className="admin-user-detail-info-line">
    <span>{label}: </span>
    <strong>{value ?? '—'}</strong>
  </p>
);

const InfoBlock = ({ label, value }) => (
  <div className="admin-user-detail-info-row">
    <span className="admin-user-detail-info-label">{label}</span>
    <strong className="admin-user-detail-info-value">{value ?? '—'}</strong>
  </div>
);

export default function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return undefined;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminUserService.getUserById(userId);
        if (isMounted) setUser(res.data.data);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [userId, onClose]);

  if (!userId) return null;

  const isCustomer = user?.vai_tro === 'khach_hang';
  const isPartner = user?.vai_tro === 'doi_tac';
  const customer = user?.khach_hang;
  const partner = user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;

  const displayName = isCustomer
    ? customer?.ho_ten
    : isPartner
      ? partner?.ten_cong_ty
      : 'Admin';

  const roleLabel = isCustomer ? 'Khách hàng' : isPartner ? 'Đối tác' : 'Admin';
  const roleCls = isCustomer ? 'admin-user-detail-role--customer' : 'admin-user-detail-role--partner';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box admin-user-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-detail-title"
      >
        <h2 id="admin-user-detail-title" className="admin-user-detail-title">Chi tiết Người Dùng</h2>

        {loading ? (
          <div className="admin-user-detail-loading">Đang tải...</div>
        ) : !user ? (
          <div className="admin-user-detail-loading">Không tìm thấy người dùng</div>
        ) : (
          <>
            <div className="admin-user-detail-profile-card">
              <div className="admin-user-detail-avatar" aria-hidden>
                {getNameInitial(displayName)}
              </div>
              <div className="admin-user-detail-profile-text">
                <div className="admin-user-detail-name">{displayName || 'Chưa cập nhật'}</div>
                <div className="admin-user-detail-contact">
                  Email: {user.email}
                  <br />
                  Số điện thoại: {user.so_dien_thoai || '—'}
                </div>
              </div>
              <span className={`admin-user-detail-role ${roleCls}`}>{roleLabel}</span>
            </div>

            {isCustomer && (
              <div className="admin-user-detail-info-card admin-user-detail-info-card--center">
                <h3 className="admin-user-detail-info-title">Thông tin khách hàng</h3>
                <InfoLine label="Mã người dùng" value={user.ma_nguoi_dung} />
                <InfoLine label="Email" value={user.email} />
                <InfoLine label="Số điện thoại" value={user.so_dien_thoai} />
                <InfoLine label="Trạng thái tài khoản" value={ACCOUNT_STATUS[user.trang_thai] || user.trang_thai} />
                <InfoLine label="Ngày tạo tài khoản" value={formatDate(user.ngay_tao)} />
                <InfoLine label="Đăng nhập gần nhất" value={formatDate(user.dang_nhap_cuoi)} />
                <InfoLine label="Tổng lần đặt" value={`${customer?.tong_lan_dat || 0} lần`} />
                <InfoLine label="Tổng chi tiêu" value={formatCurrency(customer?.tong_tien_da_chi)} />
              </div>
            )}

            {isPartner && partner && (
              <div className="admin-user-detail-grid">
                <div className="admin-user-detail-info-card">
                  <h3 className="admin-user-detail-info-title">Tài khoản đăng nhập</h3>
                  <InfoBlock label="Mã người dùng" value={user.ma_nguoi_dung} />
                  <InfoBlock label="Email" value={user.email} />
                  <InfoBlock label="Số điện thoại" value={user.so_dien_thoai} />
                  <InfoBlock label="Trạng thái tài khoản" value={ACCOUNT_STATUS[user.trang_thai] || user.trang_thai} />
                  <InfoBlock label="Đăng nhập gần nhất" value={formatDate(user.dang_nhap_cuoi)} />
                </div>
                <div className="admin-user-detail-info-card">
                  <h3 className="admin-user-detail-info-title">Thông tin hồ sơ đối tác</h3>
                  <InfoBlock label="Tên công ty" value={partner.ten_cong_ty} />
                  <InfoBlock label="Mã đối tác" value={partner.ma_doi_tac} />
                  <InfoBlock label="Địa chỉ" value={partner.dia_chi} />
                  <InfoBlock label="Mã số thuế" value={partner.ma_so_thue} />
                  <InfoBlock
                    label="Tỉ lệ hoa hồng"
                    value={partner.phan_tram_hoa_hong != null ? `${partner.phan_tram_hoa_hong}%` : 'Mặc định hệ thống'}
                  />
                  <InfoBlock
                    label="Trạng thái hợp tác"
                    value={PARTNER_STATUS[partner.trang_thai] || partner.trang_thai}
                  />
                  <InfoBlock label="Ngày cấp tài khoản" value={formatDate(partner.ngay_cap_tai_khoan)} />
                </div>
              </div>
            )}
          </>
        )}

        <div className="admin-user-detail-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
