import { LogIn, LogOut } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../utils/bookingDisplay';

const PartnerBookingCheckConfirmModal = ({
  booking,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!booking || !action) return null;

  const isCheckIn = action === 'check-in';
  const hotel = booking.loai_phong?.khach_san;

  return (
    <div className="modal-overlay booking-check-confirm-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-booking-check-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isCheckIn ? ' is-unlock' : ' is-lock'}`}>
              {isCheckIn ? <LogIn size={20} /> : <LogOut size={20} />}
            </span>
            <h3 className="modal-title" id="partner-booking-check-title">
              {isCheckIn ? 'Xác nhận check-in' : 'Xác nhận check-out'}
            </h3>
          </div>
        </div>

        <div className="user-lock-confirm-modal-body">
        
          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Mã đơn</span>
              <strong>{booking.ma_don_hang}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Khách hàng</span>
              <strong>{booking.khach_hang?.ho_ten || booking.ten_nguoi_nhan || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Khách sạn</span>
              <strong>{hotel?.ten || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Loại phòng</span>
              <strong>{booking.loai_phong?.ten_loai || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Nhận / Trả phòng</span>
              <strong>
                {formatDate(booking.ngay_nhan_phong)} → {formatDate(booking.ngay_tra_phong)}
              </strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Tổng tiền</span>
              <strong>{formatCurrency(booking.thanh_toan_cuoi)}</strong>
            </div>
          </div>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isCheckIn ? 'Xác nhận check-in' : 'Xác nhận check-out')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerBookingCheckConfirmModal;
