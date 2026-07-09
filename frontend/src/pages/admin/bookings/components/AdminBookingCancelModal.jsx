import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../utils/bookingDisplay';

const AdminBookingCancelModal = ({
  booking,
  loading,
  onClose,
  onConfirm,
}) => {
  const [lyDo, setLyDo] = useState('');

  useEffect(() => {
    if (!booking) {
      setLyDo('');
    }
  }, [booking]);

  if (!booking) return null;

  const hotel = booking.loai_phong?.khach_san;

  const handleConfirm = () => {
    if (!lyDo.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }
    onConfirm(lyDo.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-booking-cancel-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className="user-lock-confirm-modal-icon is-lock">
              <AlertTriangle size={20} />
            </span>
            <h3 className="modal-title" id="admin-booking-cancel-title">
              Xác nhận hủy đơn đặt phòng
            </h3>
          </div>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            Vui lòng nhập lý do rõ ràng.
          </p>

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

          <label className="booking-reject-label" htmlFor="admin-cancel-reason">
            Lý do hủy <span style={{ color: '#e05c5c' }}>*</span>
          </label>
          <textarea
            id="admin-cancel-reason"
            rows={3}
            className="booking-reject-textarea"
            placeholder="VD: Khách yêu cầu hủy, khách sạn không đủ phòng..."
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
          />
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingCancelModal;
