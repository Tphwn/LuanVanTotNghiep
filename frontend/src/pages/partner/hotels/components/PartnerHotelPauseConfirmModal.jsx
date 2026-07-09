import { AlertTriangle, PauseCircle, PlayCircle } from 'lucide-react';

const PartnerHotelPauseConfirmModal = ({
  hotel,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!hotel || !action) return null;

  const isPause = action === 'pause';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-hotel-pause-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isPause ? ' is-lock' : ' is-unlock'}`}>
              {isPause ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            </span>
            <h3 className="modal-title" id="partner-hotel-pause-title">
              {isPause ? 'Xác nhận tạm ngưng khách sạn' : 'Xác nhận mở lại hoạt động'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isPause
              ? 'Bạn có chắc muốn tạm ngưng khách sạn này không?'
              : 'Bạn có chắc muốn mở lại hoạt động cho khách sạn này không? '}
          </p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Tên khách sạn</span>
              <strong>{hotel.ten}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Địa chỉ</span>
              <strong>{hotel.dia_chi || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Địa điểm</span>
              <strong>{hotel.dia_diem?.ten_dia_diem || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${isPause ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isPause ? 'Xác nhận tạm ngưng' : 'Xác nhận mở lại')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerHotelPauseConfirmModal;
