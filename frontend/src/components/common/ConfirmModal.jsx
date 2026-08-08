import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ReasonField from './ReasonField';

const ConfirmModal = ({
  open,
  title,
  intro,
  icon,
  variant = 'primary',
  infoRows = [],
  warning,
  reason,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [reasonValue, setReasonValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReasonValue('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  const handleConfirm = () => {
    if (reason?.required && !reasonValue.trim()) {
      setError(`Vui lòng nhập ${(reason.label || 'lý do').toLowerCase()}`);
      return;
    }
    onConfirm(reason ? reasonValue.trim() : undefined);
  };

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
            <span className={`user-lock-confirm-modal-icon${isDanger ? ' is-lock' : ' is-unlock'}`}>
              {icon || <AlertTriangle size={20} />}
            </span>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          {intro && <p className="user-lock-confirm-modal-intro">{intro}</p>}

          {infoRows.length > 0 && (
            <div className="user-lock-confirm-modal-info">
              {infoRows.map((row) => (
                <div className="user-lock-confirm-modal-row" key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          )}

          {warning && (
            <div className="user-lock-confirm-modal-warning" style={{ marginTop: 14 }}>
              <AlertTriangle size={16} />
              <span>{warning}</span>
            </div>
          )}

          {reason && (
            <ReasonField
              id={reason.id || 'confirm-modal-reason'}
              label={reason.label || 'Lý do'}
              required={reason.required}
              value={reasonValue}
              onChange={(e) => {
                setReasonValue(e.target.value);
                if (error) setError('');
              }}
              error={error}
              hint={reason.hint}
              placeholder={reason.placeholder || ''}
            />
          )}
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
