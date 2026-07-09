import { AlertTriangle, Lock, Unlock } from 'lucide-react';

const ROLE_LABEL = {
  khach_hang: 'Khách hàng',
  doi_tac: 'Đối tác',
};

const UserLockConfirmModal = ({
  user,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!user || !action) return null;

  const isLock = action === 'lock';
  const displayName = user.displayName || user.email;
  const roleLabel = ROLE_LABEL[user.vai_tro] || user.vai_tro;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-lock-confirm-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isLock ? ' is-lock' : ' is-unlock'}`}>
              {isLock ? <Lock size={20} /> : <Unlock size={20} />}
            </span>
            <h3 className="modal-title" id="user-lock-confirm-title">
              {isLock ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isLock
              ? 'Bạn có chắc muốn khóa tài khoản này không? Người dùng sẽ không thể đăng nhập sau khi bị khóa.'
              : 'Bạn có chắc muốn mở khóa tài khoản này không? Người dùng sẽ có thể đăng nhập lại.'}
          </p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Họ tên / Tên công ty</span>
              <strong>{displayName}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Vai trò</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>

          {isLock && user.vai_tro === 'doi_tac' && (
            <div className="user-lock-confirm-modal-warning">
              <AlertTriangle size={16} />
              <span>
                Khóa đối tác sẽ đồng thời tạm ngưng các khách sạn và loại phòng liên quan trên hệ thống.
              </span>
            </div>
          )}
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${isLock ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLockConfirmModal;
