import { Loader2 } from 'lucide-react';
import formatCurrency from '../../utils/formatCurrency';

const METHOD_LABEL = {
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  the_tin_dung: 'Thẻ tín dụng',
};

const fmtMoney = formatCurrency;

const fmtStayDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ConfirmPaymentModal({
  booking,
  method,
  amount,
  submitting,
  error,
  onClose,
  onConfirm,
}) {
  if (!booking) return null;

  const methodLabel = METHOD_LABEL[method] || method;
  const luuTru = booking.luu_tru || {};
  const guestCount = Number(luuTru.so_nguoi_lon) || 0;
  const roomCount = Math.max(Number(luuTru.so_phong) || 1, 1);
  const stayLabel = luuTru.ngay_nhan
    ? `${fmtStayDate(luuTru.ngay_nhan)} → ${fmtStayDate(luuTru.ngay_tra)} · ${luuTru.so_dem || 1} đêm`
    : '—';

  const handleOverlayClick = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="presentation">
      <div
        className="modal-box confirm-payment-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-busy={submitting ? 'true' : undefined}
        aria-labelledby="confirm-payment-title"
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="confirm-payment-title">
              Xác nhận thanh toán
            </h3>
            <p className="confirm-payment-modal-sub">
              Mã đơn:
              {' '}
              <strong>{booking.ma_don || booking.ma_don_hang || booking.ma_dat_phong}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng" disabled={submitting}>
            ×
          </button>
        </div>

        <div className="confirm-payment-modal-body">
          <p className="confirm-payment-modal-intro">
            {method === 'vnpay'
              ? 'Bạn sẽ được chuyển đến cổng VNPay để hoàn tất thanh toán.'
              : 'Vui lòng kiểm tra thông tin trước khi xác nhận thanh toán.'}
          </p>

          <ul className="confirm-payment-summary">
            <li>
              <span>Khách sạn</span>
              <strong>{booking.khach_san?.ten || '—'}</strong>
            </li>
            <li>
              <span>Loại phòng</span>
              <strong>{booking.loai_phong?.ten_loai || '—'}</strong>
            </li>
            <li>
              <span>Ngày lưu trú</span>
              <strong>{stayLabel}</strong>
            </li>
            <li>
              <span>Số người ở</span>
              <strong>
                {guestCount}
                {' khách · '}
                {roomCount}
                {' phòng'}
              </strong>
            </li>
            <li>
              <span>Phương thức</span>
              <strong>{methodLabel}</strong>
            </li>
            <li className="confirm-payment-summary--total">
              <span>Tổng tiền</span>
              <strong>{fmtMoney(amount)}</strong>
            </li>
          </ul>

          {submitting && (
            <p className="confirm-payment-modal-loading-hint" role="status">
              Đang xác nhận giao dịch, vui lòng chờ trong giây lát…
            </p>
          )}

          {error && <p className="confirm-payment-modal-error">{error}</p>}
        </div>

        <div className="confirm-payment-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Quay lại
          </button>
          <button
            type="button"
            className={`confirm-payment-modal-confirm${submitting ? ' is-loading' : ''}`}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="confirm-payment-modal-spinner" size={18} strokeWidth={2.25} aria-hidden />
                <span>Đang xử lý...</span>
              </>
            ) : method === 'vnpay' ? (
              'Tiếp tục với VNPay'
            ) : (
              'Xác nhận thanh toán'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
