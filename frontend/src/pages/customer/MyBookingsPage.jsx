import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapPin } from 'lucide-react';
import customerBookingService from '../../services/customerBookingService';
import CustomerButton from '../../components/customer/CustomerButton';
import CustomerPrice from '../../components/customer/CustomerPrice';
import CancelBookingModal from '../../components/customer/CancelBookingModal';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { TRANG_THAI } from '../../utils/bookingDisplay';
import { Link } from 'react-router-dom';
import '../../assets/styles/home.css';
const fmtDateCard = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả', tone: 'all' },
  { id: 'da_checkin', label: 'Đã check-in', tone: 'checkin' },
  { id: 'hoan_thanh', label: 'Hoàn thành', tone: 'done' },
  { id: 'da_huy', label: 'Đã Hủy', tone: 'cancel' },
];

const getStatusMeta = (status) => {
  const base = TRANG_THAI[status] || { label: status, cls: 'badge-default' };
  if (status === 'da_huy' || status === 'tu_choi') {
    return { label: 'Đã Hủy', tone: 'cancel' };
  }
  if (status === 'hoan_thanh') {
    return { label: 'Hoàn thành', tone: 'done' };
  }
  if (status === 'da_checkin') {
    return { label: 'Đã check-in', tone: 'checkin' };
  }
  if (status === 'da_xac_nhan' || status === 'cho_xac_nhan') {
    return { label: 'Chờ check-in', tone: 'pending' };
  }
  return { label: base.label, tone: 'pending' };
};

const canCancelBooking = (status) => status === 'cho_xac_nhan' || status === 'da_xac_nhan';

const MyBookingsPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadBookings = () => customerBookingService.getMyBookings()
    .then((res) => setBookings(res.data?.data || []))
    .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách đặt chỗ'));

  useEffect(() => {
    if (!token) return;

    if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadBookings().finally(() => setLoading(false));
  }, [token, user]);

  const handleCancelConfirmed = (updated) => {
    setBookings((prev) => prev.map((item) => (
      item.ma_dat_phong === updated.ma_dat_phong ? updated : item
    )));
    showToast('Đã hủy đơn đặt phòng thành công');
  };

  const stats = useMemo(() => ({
    all: bookings.length,
    da_checkin: bookings.filter((b) => b.trang_thai === 'da_checkin').length,
    hoan_thanh: bookings.filter((b) => b.trang_thai === 'hoan_thanh').length,
    da_huy: bookings.filter((b) => b.trang_thai === 'da_huy' || b.trang_thai === 'tu_choi').length,
  }), [bookings]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    if (statusFilter === 'da_huy') {
      return bookings.filter((b) => b.trang_thai === 'da_huy' || b.trang_thai === 'tu_choi');
    }
    return bookings.filter((b) => b.trang_thai === statusFilter);
  }, [bookings, statusFilter]);

  if (!token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return (
      <div className="content-card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 48 }}>
        <h2 style={{ margin: '0 0 8px', color: '#1a2e28' }}>Tính năng dành cho khách hàng</h2>
        <p style={{ color: '#5a7a72', marginBottom: 20 }}>
          Tài khoản {user.vai_tro === ROLES.ADMIN ? 'quản trị' : 'đối tác'} không có đặt chỗ cá nhân tại đây.
        </p>
        <CustomerButton to={ROUTES.HOME}>Về trang chủ</CustomerButton>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 16 }}>
          {toast.msg}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="my-bookings-stats">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`my-bookings-stat my-bookings-stat--${tab.tone}${statusFilter === tab.id ? ' active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <div className="my-bookings-stat-value">{stats[tab.id] ?? 0}</div>
              <div className="my-bookings-stat-label">{tab.label}</div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
          Đang tải đặt chỗ...
        </div>
      )}

      {!loading && error && (
        <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#e05c5c' }}>
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text" style={{ fontSize: 16, marginBottom: 8 }}>Bạn chưa có đơn đặt phòng nào</p>
          <p style={{ fontSize: 14, color: '#94a8a2', margin: '0 0 20px' }}>
            Khám phá hàng trăm khách sạn và đặt phòng chỉ với vài bước
          </p>
          <CustomerButton to={ROUTES.HOME}>Tìm khách sạn ngay</CustomerButton>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text">Không có đơn nào trong mục này</p>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setStatusFilter('all')}>
            Xem tất cả đơn
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="my-bookings-list">
          {filtered.map((b) => {
            const statusMeta = getStatusMeta(b.trang_thai);
            const address = b.khach_san?.dia_chi
              || [b.khach_san?.dia_diem?.ten_dia_diem].filter(Boolean).join('');

            return (
              <article key={b.ma_dat_phong} className="my-booking-card">
                <div className="my-booking-main">
                  <div className="my-booking-top">
                    <div className="my-booking-head">
                      <h2 className="my-booking-hotel">
                        Khách sạn: {b.khach_san?.ten || '—'}
                      </h2>
                      {address && (
                        <p className="my-booking-location">
                          <MapPin size={14} strokeWidth={2} aria-hidden />
                          <span>{address}</span>
                        </p>
                      )}
                    </div>
                    <span className={`my-booking-status my-booking-status--${statusMeta.tone}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="my-booking-dates">
                    <div className="my-booking-date-block">
                      <div className="my-booking-date-label">Nhận phòng</div>
                      <div className="my-booking-date-value">{fmtDateCard(b.ngay_nhan_phong)}</div>
                    </div>
                    <div className="my-booking-date-block">
                      <div className="my-booking-date-label">Trả phòng</div>
                      <div className="my-booking-date-value">{fmtDateCard(b.ngay_tra_phong)}</div>
                    </div>
                  </div>
                  <Link
                    to={ROUTES.CUSTOMER.MY_BOOKING_DETAIL.replace(':id', b.ma_dat_phong)}
                    className="my-booking-detail-link"
                  >
                    Chi tiết đơn
                  </Link>
                </div>

                <div className="my-booking-aside">
                  <div className="my-booking-pay">
                    <span className="my-booking-price-label">Tổng thanh toán</span>
                    <CustomerPrice
                      amount={b.thanh_toan_cuoi}
                      unit="VNĐ"
                      className="my-booking-price-value"
                    />
                  </div>
                  {(b.co_the_huy || canCancelBooking(b.trang_thai)) && (
                    <button
                      type="button"
                      className="my-booking-cancel-btn"
                      onClick={() => setCancelTarget(b)}
                    >
                      Hủy đơn
                    </button>
                  )}
                  {b.hoan_tien?.trang_thai_label && (
                    <span className={`my-booking-refund-status my-booking-refund-status--${b.hoan_tien.trang_thai}`}>
                      Hoàn tiền: {b.hoan_tien.trang_thai_label}
                    </span>
                  )}
                  {b.co_the_danh_gia && (
                    <CustomerButton
                      className="my-booking-review-btn"
                      to={ROUTES.CUSTOMER.MY_BOOKING_REVIEW.replace(':id', b.ma_dat_phong)}
                    >
                      Đánh giá
                    </CustomerButton>
                  )}
                  {b.da_danh_gia && (
                    <CustomerButton
                      className="my-booking-review-btn my-booking-review-btn--view"
                      to={ROUTES.CUSTOMER.MY_BOOKING_REVIEW_VIEW.replace(':id', b.ma_dat_phong)}
                    >
                      Xem lại đánh giá
                    </CustomerButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirmed={handleCancelConfirmed}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
