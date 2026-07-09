import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

const AdminRoomTypeLockConfirmModal = ({
  room,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!room) return;
    setReason('');
    setError('');
  }, [room, action]);

  if (!room || !action) return null;

  const isLock = action === 'hide';

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
        aria-labelledby="room-type-lock-confirm-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isLock ? ' is-lock' : ' is-unlock'}`}>
              {isLock ? <Lock size={20} /> : <Unlock size={20} />}
            </span>
            <h3 className="modal-title" id="room-type-lock-confirm-title">
              {isLock ? 'Xác nhận ẩn loại phòng' : 'Xác nhận mở loại phòng'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isLock
              ? 'Bạn có chắc muốn ẩn loại phòng này khỏi hệ thống? '
              : 'Bạn có chắc muốn mở lại loại phòng này?'}
          </p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Tên loại phòng</span>
              <strong>{room.ten_loai}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Khách sạn</span>
              <strong>{room.khach_san?.ten || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Đối tác</span>
              <strong>{room.khach_san?.doi_tac?.ten_cong_ty || '—'}</strong>
            </div>
          </div>

          {isLock ? (
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="room-type-lock-reason"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#334155' }}
              >
                Lý do khóa
                {' '}
                <span style={{ color: '#cf1322' }}>*</span>
              </label>
              <textarea
                id="room-type-lock-reason"
                rows={4}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: Vi phạm chính sách, thông tin không chính xác..."
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
             
            </div>
          ) : null}
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
            {loading ? 'Đang xử lý...' : (isLock ? 'Xác nhận ẩn' : 'Xác nhận mở')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRoomTypeLockConfirmModal;
