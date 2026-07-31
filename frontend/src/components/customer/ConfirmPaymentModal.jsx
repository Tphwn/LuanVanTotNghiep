const METHOD_LABEL = {
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  the_tin_dung: 'Thẻ tín dụng',
};

const fmtMoney = (v) => `${new Intl.NumberFormat('vi-VN').format(Number(v) || 0)}₫`;

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

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box confirm-payment-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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
              <span>Phương thức</span>
              <strong>{methodLabel}</strong>
            </li>
            <li className="confirm-payment-summary--total">
              <span>Số tiền thanh toán</span>
              <strong>{fmtMoney(amount)}</strong>
            </li>
          </ul>

          {error && <p className="confirm-payment-modal-error">{error}</p>}
        </div>

        <div className="confirm-payment-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Quay lại
          </button>
          <button
            type="button"
            className="confirm-payment-modal-confirm"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting
              ? 'Đang xử lý...'
              : method === 'vnpay'
                ? 'Tiếp tục với VNPay'
                : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
}
