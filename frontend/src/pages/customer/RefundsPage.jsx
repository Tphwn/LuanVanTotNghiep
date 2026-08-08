import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import customerBookingService from '../../services/customerBookingService';
import CustomerButton from '../../components/customer/CustomerButton';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import formatCurrency from '../../utils/formatCurrency';
import '../../assets/styles/home.css';

const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  const time = dt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day}/${month}/${year} - ${time}`;
};

const fmtVnd = formatCurrency;

const RefundsPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      setLoading(false);
      return;
    }
    setLoading(true);
    customerBookingService.getMyRefunds()
      .then((res) => setItems(res.data?.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách hoàn tiền'))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return (
      <div className="content-card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 48 }}>
        <h2 style={{ margin: '0 0 8px', color: '#1a2e28' }}>Tính năng dành cho khách hàng</h2>
        <CustomerButton to={ROUTES.HOME}>Về trang chủ</CustomerButton>
      </div>
    );
  }

  return (
    <div className="refunds-page">
      <header className="tx-page-header">
        <h1 className="tx-page-title">Hoàn tiền</h1>
        <p className="tx-page-desc">Danh sách đơn đã hủy / bị hủy và thông tin hoàn tiền</p>
      </header>

      {loading && (
        <div className="content-card" style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
          Đang tải yêu cầu hoàn tiền...
        </div>
      )}

      {!loading && error && (
        <div className="content-card" style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text">Chưa có đơn hủy / hoàn tiền nào</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="refunds-list">
          {items.map((item) => {
            const refundStatusLabel = item.hoan_tien?.trang_thai_label
              || (item.hoan_tien ? item.hoan_tien.trang_thai : 'Không phát sinh hoàn tiền');
            const refundTone = item.hoan_tien?.trang_thai || 'none';

            return (
              <article key={item.ma_dat_phong} className="refund-card">
                <div className="refund-card-top">
                  <div>
                    <h2 className="refund-card-hotel">{item.khach_san?.ten || '—'}</h2>
                    <p className="refund-card-code">
                      Mã đơn:
                      {' '}
                      <strong>{item.ma_don_hang || item.ma_dat_phong}</strong>
                    </p>
                  </div>
                  <span className="my-booking-status my-booking-status--cancel">
                    {item.trang_thai_label || 'Đã hủy'}
                  </span>
                </div>

                <div className="refund-card-grid">
                  <div>
                    <span className="refund-card-label">Số tiền đơn</span>
                    <strong className="refund-card-order-amount">
                      {fmtVnd(item.thanh_toan_cuoi)}
                    </strong>
                  </div>
                  <div>
                    <span className="refund-card-label">Số tiền hoàn</span>
                    <strong className="refund-card-amount">
                      {fmtVnd(item.hoan_tien?.so_tien_hoan || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="refund-card-label">Trạng thái hoàn</span>
                    <span className={`refund-status-badge refund-status-badge--${refundTone}`}>
                      {refundStatusLabel}
                    </span>
                  </div>
                  <div>
                    <span className="refund-card-label">Ngày yêu cầu</span>
                    <strong className="refund-card-date">
                      {fmtDateTime(item.ngay_yeu_cau_hoan || item.ngay_dat)}
                    </strong>
                  </div>
                </div>

                <Link
                  to={ROUTES.CUSTOMER.REFUND_DETAIL.replace(':id', item.ma_dat_phong)}
                  className="my-booking-detail-link"
                >
                  Xem chi tiết hoàn tiền
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefundsPage;
