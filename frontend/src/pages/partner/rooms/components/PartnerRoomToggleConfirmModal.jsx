import { Lock, Unlock } from 'lucide-react';

const PartnerRoomToggleConfirmModal = ({
  room,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!room) return null;

  const isActive = room.trang_thai === 'hoat_dong';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isActive ? ' is-lock' : ' is-unlock'}`}>
              {isActive ? <Lock size={20} /> : <Unlock size={20} />}
            </span>
            <h3 className="modal-title">
              {isActive ? 'Xác nhận ẩn loại phòng' : 'Xác nhận mở loại phòng'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isActive
              ? `Bạn có chắc muốn ẩn loại phòng "${room.ten_loai}"? Phòng sẽ tạm ngưng mở bán.`
              : `Bạn có chắc muốn mở lại loại phòng "${room.ten_loai}"?`}
          </p>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isActive ? 'Xác nhận ẩn' : 'Xác nhận mở')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerRoomToggleConfirmModal;
