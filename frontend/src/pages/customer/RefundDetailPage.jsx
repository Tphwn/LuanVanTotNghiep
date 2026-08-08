import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BackButton from '../../components/common/BackButton';
import customerBookingService from '../../services/customerBookingService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { formatBookingDate } from '../../utils/bookingDisplay';
import formatCurrency from '../../utils/formatCurrency';
import '../../assets/styles/home.css';

const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const date = dt.toLocaleDateString('vi-VN');
  const time = dt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
};

const fmtVnd = formatCurrency;

const InfoRow = ({ label, value }) => (
  <div className="refund-detail-row">
    <span className="refund-detail-row-label">{label}</span>
    <span className="refund-detail-row-value">{value ?? '—'}</span>
  </div>
);

const RefundDetailPage = () => {
  const { id } = useParams();
  const bookingId = Number(id);
  const { user, token } = useSelector((state) => state.auth);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !bookingId || Number.isNaN(bookingId)) {
      setLoading(false);
      setError('Mã hoàn tiền không hợp lệ');
      return;
    }
    if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    customerBookingService.getMyRefundById(bookingId)
      .then((res) => {
        if (!mounted) return;
        const data = res.data?.data;
        if (!data) {
          setError('Không tìm thấy yêu cầu hoàn tiền');
          setItem(null);
          return;
        }
        setItem(data);
      })
      .catch((err) => {
        if (mounted) {
          setItem(null);
          setError(err.response?.data?.message || 'Không thể tải chi tiết hoàn tiền');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [token, user, bookingId]);

  if (!token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (loading) {
    return (
      <div className="refund-detail-page">
        <div className="booking-confirm-loading">Đang tải chi tiết hoàn tiền...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="refund-detail-page">
        <div className="booking-confirm-error-card">
          <p>{error || 'Không tìm thấy yêu cầu hoàn tiền'}</p>
          <BackButton to={ROUTES.CUSTOMER.REFUNDS} variant="outline" />
        </div>
      </div>
    );
  }

  const refundTone = item.hoan_tien?.trang_thai || 'none';
  const refundStatusLabel = item.hoan_tien?.trang_thai_label
    || (item.hoan_tien ? item.hoan_tien.trang_thai : 'Không phát sinh hoàn tiền');

  const paidAmount = Number(item.so_tien_da_thanh_toan || item.thanh_toan_cuoi) || 0;
  const refundAmount = Number(item.hoan_tien?.so_tien_hoan) || 0;
  const cancelFee = Math.max(0, paidAmount - refundAmount);
  const feePercent = paidAmount > 0 ? Math.round((cancelFee / paidAmount) * 100) : 0;

  return (
    <div className="refund-detail-page">
      <div className="tx-detail-top">
        <BackButton to={ROUTES.CUSTOMER.REFUNDS} label="Quay lại hoàn tiền" />
        <div className="tx-detail-top-row">
          <h1 className="tx-detail-title">Chi tiết hoàn tiền</h1>
          <span className="tx-detail-id">
            Mã đơn:
            {' '}
            {item.ma_don_hang || item.ma_dat_phong}
          </span>
        </div>
      </div>

      <section className="tx-detail-panel">
        <h2 className="tx-detail-panel-title">Thông tin đơn</h2>
        <div className="refund-detail-grid">
          <InfoRow label="Khách sạn" value={item.khach_san?.ten} />
          <InfoRow label="Loại phòng" value={item.ten_loai_phong} />
          <InfoRow label="Địa chỉ" value={item.khach_san?.dia_chi} />
          <InfoRow label="Ngày nhận phòng" value={formatBookingDate(item.ngay_nhan_phong)} />
          <InfoRow label="Ngày trả phòng" value={formatBookingDate(item.ngay_tra_phong)} />
          <InfoRow label="Trạng thái đơn" value={item.trang_thai_label || 'Đã hủy'} />
        </div>
      </section>

      <section className="booking-detail-block booking-detail-block--cancel refund-detail-cancel">
        <h2 className="booking-detail-block-title">
          {item.huy_boi_admin ? 'Đơn bị admin hủy' : 'Thông tin hủy đơn'}
        </h2>
        {(item.ly_do_huy || item.ly_do_hoan) && (
          <p className="booking-detail-cancel-reason">
            <span className="booking-detail-cancel-reason-label">
              {item.huy_boi_admin ? 'Lý do admin hủy' : 'Lý do hủy'}
              :
            </span>
            {' '}
            {item.ly_do_huy || item.ly_do_hoan}
          </p>
        )}
        {item.tom_tat_hoan_tien && (
          <p className="booking-detail-cancel-summary refund-detail-cancel-summary">
            {item.tom_tat_hoan_tien}
          </p>
        )}
        <div className="booking-detail-cancel-status">
          <span className="booking-detail-cancel-status-label">Trạng thái hoàn tiền</span>
          <span className={`refund-status-badge refund-status-badge--${refundTone}`}>
            {refundStatusLabel}
          </span>
        </div>
        <div className="refund-detail-grid refund-detail-meta">
          <InfoRow label="Ngày yêu cầu hoàn" value={fmtDateTime(item.ngay_yeu_cau_hoan || item.ngay_dat)} />
          <InfoRow label="Ngày xử lý" value={fmtDateTime(item.ngay_xu_ly_hoan)} />
        </div>
      </section>

      <div className="booking-detail-totals refund-detail-totals">
        <div className="booking-detail-total-row booking-detail-total-row--muted">
          <span className="booking-detail-total-label">Tổng tiền đã thanh toán (Ban đầu)</span>
          <strong className="booking-detail-total-amount booking-detail-total-amount--muted">
            {fmtVnd(paidAmount)}
          </strong>
        </div>
        <div className="booking-detail-total-row booking-detail-total-row--fee">
          <span className="booking-detail-total-label">
            Phí hủy đơn (
            {feePercent}
            %)
          </span>
          <strong className="booking-detail-total-amount booking-detail-total-amount--fee">
            {fmtVnd(cancelFee)}
          </strong>
        </div>
        <div className="booking-detail-total-row booking-detail-total-row--refund">
          <span className="booking-detail-total-label">Tổng tiền được hoàn trả</span>
          <strong className="booking-detail-total-amount booking-detail-total-amount--refund">
            {fmtVnd(refundAmount)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default RefundDetailPage;
