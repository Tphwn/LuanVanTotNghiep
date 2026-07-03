import { Pencil, Trash2 } from 'lucide-react';

export default function AdminFormModal({
  open,
  title,
  subtitle,
  children,
  onClose,
  onSave,
  onDelete,
  saveLabel = 'Lưu thông tin',
  deleteLabel = 'Xóa',
  showSave = false,
  showDelete = false,
  showClose = true,
  loading = false,
  size = 'md',
  icon: Icon = Pencil,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay admin-form-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`admin-form-modal admin-form-modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-form-modal__header">
          <div className="admin-form-modal__header-left">
            {Icon && (
              <span className="admin-form-modal__icon" aria-hidden>
                <Icon size={18} strokeWidth={2} />
              </span>
            )}
            <div>
              <h3 className="admin-form-modal__title">{title}</h3>
              {subtitle && <p className="admin-form-modal__subtitle">{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="admin-form-modal__close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="admin-form-modal__body">{children}</div>

        {(showSave || showDelete || showClose) && (
          <div className="admin-form-modal__footer">
            <div className="admin-form-modal__footer-left">
              {showDelete && onDelete && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm admin-form-modal__delete-btn"
                  onClick={onDelete}
                  disabled={loading}
                >
                  <Trash2 size={14} />
                  {deleteLabel}
                </button>
              )}
            </div>
            <div className="admin-form-modal__footer-right">
              {showClose && (
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                  Đóng
                </button>
              )}
              {showSave && onSave && (
                <button type="button" className="btn btn-primary" onClick={onSave} disabled={loading}>
                  {loading ? 'Đang lưu...' : saveLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
