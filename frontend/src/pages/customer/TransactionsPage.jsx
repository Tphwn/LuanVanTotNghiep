import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, MoreHorizontal } from 'lucide-react';
import customerBookingService from '../../services/customerBookingService';
import CustomerButton from '../../components/customer/CustomerButton';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import '../../assets/styles/home.css';

const fmtMoney = (v) => `${new Intl.NumberFormat('vi-VN').format(Number(v) || 0)} VND`;

const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const getRemainingMs = (deadlineIso) => {
  if (!deadlineIso) return 0;
  const t = new Date(deadlineIso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, t - Date.now());
};

const statusBadge = (tx, remainingMs) => {
  if (tx.can_thanh_toan) {
    return {
      tone: 'waiting',
      label: `Đang xử lý thanh toán • ${formatCountdown(remainingMs)}`,
    };
  }
  if (tx.thanh_toan_trang_thai === 'da_thanh_toan') {
    return { tone: 'success', label: 'Thanh toán thành công' };
  }
  if (tx.trang_thai === 'da_huy' || tx.trang_thai === 'tu_choi') {
    return { tone: 'cancel', label: tx.trang_thai_label || 'Đã hủy' };
  }
  return {
    tone: 'done',
    label: tx.buoc_giao_dich_label || tx.trang_thai_label || 'Giao dịch',
  };
};

const TransactionsPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!token) return;
    if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      setLoading(false);
      return;
    }
    setLoading(true);
    customerBookingService.getMyTransactions()
      .then((res) => setItems(res.data?.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách giao dịch'))
      .finally(() => setLoading(false));
  }, [token, user]);

  useEffect(() => {
    const hasPending = items.some((t) => t.can_thanh_toan);
    if (!hasPending) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [items]);

  const grouped = useMemo(() => {
    void tick;
    const pending = items.filter((t) => t.can_thanh_toan);
    const rest = items.filter((t) => !t.can_thanh_toan);
    return { pending, rest };
  }, [items, tick]);

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

  const renderCard = (tx) => {
    const remainingMs = getRemainingMs(tx.han_thanh_toan);
    const badge = statusBadge(tx, remainingMs);
    return (
      <article key={tx.ma_dat_phong} className="tx-card">
        <div className="tx-card-top">
          <span className="tx-card-code">
            Mã đặt chỗ
            {' '}
            {tx.ma_don_hang || tx.ma_dat_phong}
          </span>
          <strong className="tx-card-amount">{fmtMoney(tx.thanh_toan_cuoi)}</strong>
        </div>
        <div className="tx-card-hotel">
          <Building2 size={16} strokeWidth={2.25} aria-hidden />
          <span>{tx.khach_san?.ten || '—'}</span>
        </div>
        <div className="tx-card-bottom">
          <span className={`tx-card-badge tx-card-badge--${badge.tone}`}>{badge.label}</span>
          <div className="tx-card-actions">
            <Link
              to={ROUTES.CUSTOMER.TRANSACTION_DETAIL.replace(':id', tx.ma_dat_phong)}
              className="tx-card-detail-link"
            >
              Xem chi tiết
            </Link>
            <span className="tx-card-more" aria-hidden>
              <MoreHorizontal size={18} />
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="tx-page">
      <header className="tx-page-header">
        <h1 className="tx-page-title">Danh sách giao dịch</h1>
        <p className="tx-page-desc">Theo dõi trạng thái thanh toán của từng đơn đặt chỗ</p>
      </header>

      {loading && (
        <div className="content-card" style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
          Đang tải giao dịch...
        </div>
      )}

      {!loading && error && (
        <div className="content-card" style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state content-card">
          <p className="empty-state-text">Chưa có giao dịch nào</p>
          <CustomerButton to={ROUTES.HOME} style={{ marginTop: 16 }}>Tìm khách sạn</CustomerButton>
        </div>
      )}

      {!loading && !error && grouped.pending.length > 0 && (
        <section className="tx-section">
          <h2 className="tx-section-title">Đang thanh toán</h2>
          <div className="tx-list">{grouped.pending.map(renderCard)}</div>
        </section>
      )}

      {!loading && !error && grouped.rest.length > 0 && (
        <section className="tx-section">
          <h2 className="tx-section-title">
            {grouped.pending.length > 0 ? 'Giao dịch khác' : 'Tất cả giao dịch'}
          </h2>
          <div className="tx-list">{grouped.rest.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
};

export default TransactionsPage;
