import { useEffect, useState } from 'react';
import { AlertTriangle, Lock, Unlock } from 'lucide-react';

const HotelLockConfirmModal = ({
  hotel,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hotel) return;
    setReason('');
    setError('');
  }, [hotel, action]);

  if (!hotel || !action) return null;

  const isLock = action === 'lock';

  const handleConfirm = () => {
    if (isLock && !reason.trim()) {
      setError('Vui lòng nhập lý do khóa');
      return;
    }
    onConfirm(isLock ? reason.trim() : undefined);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-lock-confirm-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isLock ? ' is-lock' : ' is-unlock'}`}>
              {isLock ? <Lock size={20} /> : <Unlock size={20} />}
            </span>
            <h3 className="modal-title" id="hotel-lock-confirm-title">
              {isLock ? 'Xác nhận khóa khách sạn' : 'Xác nhận mở khóa khách sạn'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isLock
              ? 'Bạn có chắc muốn khóa khách sạn này không? Khách sạn sẽ không hiển thị trên trang chủ và các loại phòng của khách sạn này sẽ tạm ngưng.'
              : 'Bạn có chắc muốn mở khóa khách sạn này không? Khách sạn và loại phòng sẽ hoạt động trở lại.'}
          </p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Tên khách sạn</span>
              <strong>{hotel.ten}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Đối tác</span>
              <strong>{hotel.doi_tac?.ten_cong_ty || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Địa chỉ</span>
              <strong>{hotel.dia_chi || '—'}</strong>
            </div>
          </div>

          {isLock ? (
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="hotel-lock-reason"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#334155' }}
              >
                Lý do khóa <span style={{ color: '#cf1322' }}>*</span>
              </label>
              <textarea
                id="hotel-lock-reason"
                rows={4}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: Vi phạm chính sách nền tảng, thông tin không chính xác..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${error ? '#ffa39e' : '#d4ede6'}`,
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {error && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#cf1322' }}>{error}</p>
              )}
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Lý do sẽ được gửi thông báo cho đối tác quản lý khách sạn này.
              </p>
            </div>
          ) : (
            hotel.ly_do_khoa && (
              <div className="user-lock-confirm-modal-warning" style={{ marginTop: 14 }}>
                <AlertTriangle size={16} />
                <span>
                  Lý do khóa trước đó: {hotel.ly_do_khoa}
                </span>
              </div>
            )
          )}
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${isLock ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelLockConfirmModal;
