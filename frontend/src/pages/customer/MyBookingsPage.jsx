import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import customerBookingService from '../../services/customerBookingService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { TRANG_THAI } from '../../utils/bookingDisplay';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'}) :'—');
const fmtDateShort = (d) => (d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'}) :'—');

const STATUS_CLS = Object.fromEntries(
  Object.entries(TRANG_THAI).map(([key, val]) => [key, val.cls]),
);

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả'},
  { id:'da_xac_nhan', label: 'Chờ check-in'},
  { id:'da_checkin', label: 'Đang lưu trú'},
  { id:'hoan_thanh', label: 'Hoàn thành'},
  { id:'da_huy', label: 'Đã hủy'},
];

const countNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
};

const MyBookingsPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    so_sao: 5,
    noi_dung: '',
    diem_sach_se: 5,
    diem_dich_vu: 5,
    diem_vi_tri: 5,
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

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

  const stats = useMemo(() => ({
    all: bookings.length,
    da_xac_nhan: bookings.filter((b) => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).length,
    da_checkin: bookings.filter((b) => b.trang_thai === 'da_checkin').length,
    hoan_thanh: bookings.filter((b) => b.trang_thai === 'hoan_thanh').length,
    da_huy: bookings.filter((b) => b.trang_thai === 'da_huy'|| b.trang_thai ==='tu_choi').length,
  }), [bookings]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    if (statusFilter === 'da_huy') {
      return bookings.filter((b) => b.trang_thai === 'da_huy'|| b.trang_thai ==='tu_choi');
    }
    if (statusFilter === 'da_xac_nhan') {
      return bookings.filter((b) => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai));
    }
    return bookings.filter((b) => b.trang_thai === statusFilter);
  }, [bookings, statusFilter]);

  const openReview = (booking) => {
    setReviewTarget(booking);
    setReviewForm({
      so_sao: 5,
      noi_dung: '',
      diem_sach_se: 5,
      diem_dich_vu: 5,
      diem_vi_tri: 5,
    });
    setReviewMsg('');
  };

  const closeReview = () => {
    setReviewTarget(null);
    setReviewMsg('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setReviewSubmitting(true);
    setReviewMsg('');
    try {
      await customerBookingService.createReview(reviewTarget.ma_dat_phong, reviewForm);
      await loadBookings();
      closeReview();
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const renderStarSelect = (name, label) => (
    <label className="my-booking-review-field">
      <span>{label}</span>
      <select
        value={reviewForm[name]}
        onChange={(e) => setReviewForm((prev) => ({ ...prev, [name]: Number(e.target.value) }))}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} sao</option>
        ))}
      </select>
    </label>
  );

  if (!token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return (
      <div className="content-card"style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}></div>
        <h2 style={{ margin: '0 0 8px', color: '#1a2e28'}}>Tính năng dành cho khách hàng</h2>
        <p style={{ color:'#5a7a72', marginBottom: 20 }}>
          Tài khoản {user.vai_tro === ROLES.ADMIN ? 'quản trị':'đối tác'} không có đặt chỗ cá nhân tại đây.
        </p>
        <Link to={ROUTES.HOME} className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">

      {!loading && !error && bookings.length > 0 && (
        <div className="my-bookings-stats">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"className={`my-bookings-stat${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <div className="my-bookings-stat-value">{stats[tab.id] ?? 0}</div>
              <div className="my-bookings-stat-label">{tab.label}</div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="content-card"style={{ textAlign: 'center', padding: 48, color: '#5a7a72'}}>
           Đang tải đặt chỗ...
        </div>
      )}

      {!loading && error && (
        <div className="content-card"style={{ textAlign:'center', padding: 48, color: '#e05c5c'}}>
           {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text"style={{ fontSize: 16, marginBottom: 8 }}>Bạn chưa có đơn đặt phòng nào</p>
          <p style={{ fontSize: 14, color:'#94a8a2', margin: '0 0 20px'}}>
            Khám phá hàng trăm khách sạn và đặt phòng chỉ với vài bước
          </p>
          <Link to={ROUTES.HOME} className="btn btn-primary">Tìm khách sạn ngay</Link>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text">Không có đơn nào trong mục này</p>
          <button type="button"className="btn btn-ghost btn-sm"style={{ marginTop: 12 }} onClick={() => setStatusFilter('all')}>
            Xem tất cả đơn
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="my-bookings-list">
          {filtered.map((b) => {
            const nights = countNights(b.ngay_nhan_phong, b.ngay_tra_phong);
            return (
              <article key={b.ma_dat_phong} className="my-booking-card">
                <div className={`my-booking-stripe ${b.trang_thai}`} />

                <div className="my-booking-body">
                  <div className="my-booking-top">
                    <div>
                      <h2 className="my-booking-hotel">{b.khach_san?.ten || 'Khách sạn'}</h2>
                      <p className="my-booking-location">
                         {b.khach_san?.dia_diem?.ten_dia_diem || b.khach_san?.dia_chi || '—'}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_CLS[b.trang_thai] || 'badge-default'}`}>
                      {b.trang_thai_label}
                    </span>
                  </div>

                  <div className="my-booking-dates">
                    <div className="my-booking-date-block">
                      <div className="my-booking-date-label">Nhận phòng</div>
                      <div className="my-booking-date-value">{fmtDateShort(b.ngay_nhan_phong)}</div>
                      <div style={{ fontSize: 11, color: '#94a8a2'}}>{fmtDate(b.ngay_nhan_phong).split(',')[0]}</div>
                    </div>

                    <div className="my-booking-date-arrow">
                      <span style={{ color: '#d4ede6'}}>——</span>
                      <span className="my-booking-nights">{nights} đêm</span>
                      <span style={{ color:'#d4ede6'}}>——</span>
                    </div>

                    <div className="my-booking-date-block">
                      <div className="my-booking-date-label">Trả phòng</div>
                      <div className="my-booking-date-value">{fmtDateShort(b.ngay_tra_phong)}</div>
                      <div style={{ fontSize: 11, color:'#94a8a2'}}>{fmtDate(b.ngay_tra_phong).split(',')[0]}</div>
                    </div>
                  </div>

                  <div className="my-booking-meta">
                    <span className="my-booking-meta-item"> {b.ten_loai_phong}</span>
                    <span className="my-booking-meta-item"> {b.so_khach} khách</span>
                    <span className="my-booking-meta-item"> Mã đơn: <strong>{b.ma_don_hang}</strong></span>
                  </div>
                </div>

                <div className="my-booking-price">
                  <span className="my-booking-price-label">Tổng thanh toán</span>
                  <span className="my-booking-price-value">{fmt(b.thanh_toan_cuoi)} ₫</span>
                  {b.co_the_danh_gia && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={() => openReview(b)}
                    >
                      Đánh giá
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <div className="modal-overlay" onClick={closeReview} role="presentation">
          <div
            className="content-card my-booking-review-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 style={{ margin: '0 0 8px' }}>Đánh giá trải nghiệm</h3>
            <p style={{ margin: '0 0 16px', color: '#5a7a72', fontSize: 14 }}>
              {reviewTarget.khach_san?.ten} · {reviewTarget.ten_loai_phong}
            </p>
            <form onSubmit={handleReviewSubmit}>
              {renderStarSelect('so_sao', 'Điểm tổng thể')}
              {renderStarSelect('diem_sach_se', 'Độ sạch sẽ')}
              {renderStarSelect('diem_dich_vu', 'Dịch vụ')}
              {renderStarSelect('diem_vi_tri', 'Vị trí')}
              <label className="my-booking-review-field">
                <span>Nội dung (tuỳ chọn)</span>
                <textarea
                  rows={4}
                  value={reviewForm.noi_dung}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, noi_dung: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </label>
              {reviewMsg && (
                <p style={{ color: '#e05c5c', fontSize: 13, margin: '0 0 12px' }}>{reviewMsg}</p>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeReview}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
