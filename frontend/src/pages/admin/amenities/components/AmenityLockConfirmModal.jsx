import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import ReasonField from '../../../../components/common/ReasonField';
import AmenityPartnerNotifyFields from './AmenityPartnerNotifyFields';
import api from '../../../../services/api';

const AmenityLockConfirmModal = ({
  amenity,
  loading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [notifyError, setNotifyError] = useState('');
  const [notifyScope, setNotifyScope] = useState('all');
  const [partnerId, setPartnerId] = useState('');
  const [partners, setPartners] = useState([]);

  const isLock = amenity && amenity.trang_thai !== 'an';

  useEffect(() => {
    if (!amenity) return undefined;
    setReason('');
    setReasonError('');
    setNotifyError('');
    setNotifyScope('all');
    setPartnerId('');

    let cancelled = false;
    api.get('/amenities/partners-for-notify')
      .then((res) => {
        if (!cancelled) setPartners(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setPartners([]);
      });
    return () => { cancelled = true; };
  }, [amenity]);

  if (!amenity) return null;

  const handleConfirm = () => {
    if (isLock && !reason.trim()) {
      setReasonError('Vui lòng nhập lý do khóa');
      return;
    }
    if (notifyScope === 'one' && !partnerId) {
      setNotifyError('Vui lòng chọn đối tác để thông báo');
      return;
    }
    setReasonError('');
    setNotifyError('');
    onConfirm({
      ly_do: isLock ? reason.trim() : undefined,
      notify_scope: notifyScope,
      ma_doi_tac: notifyScope === 'one' ? Number(partnerId) : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal amenity-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="amenity-lock-confirm-title"
      >
        <div className="modal-header">
          <div className="user-lock-confirm-modal-heading">
            <span className={`user-lock-confirm-modal-icon${isLock ? ' is-lock' : ' is-unlock'}`}>
              {isLock ? <Lock size={20} /> : <Unlock size={20} />}
            </span>
            <h3 className="modal-title" id="amenity-lock-confirm-title">
              {isLock ? 'Xác nhận khóa tiện nghi' : 'Xác nhận mở khóa tiện nghi'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng" disabled={loading}>
            ×
          </button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            {isLock
              ? 'Tiện nghi sẽ bị khóa và không thể gắn mới cho khách sạn/loại phòng. Đối tác đang dùng vẫn thấy thông báo khóa kèm lý do.'
              : 'Tiện nghi sẽ hoạt động trở lại và có thể được gắn cho khách sạn/loại phòng.'}
          </p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Tên tiện nghi</span>
              <strong>{amenity.ten}</strong>
            </div>
          </div>

          {isLock && (
            <ReasonField
              id="amenity-lock-reason"
              label="Lý do khóa"
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError('');
              }}
              error={reasonError}
              hint="Lý do sẽ được gửi trong thông báo cho đối tác (nếu chọn gửi)."
              placeholder="VD: Tiện nghi trùng lặp, không còn phù hợp..."
            />
          )}

          <div className="amenity-lock-notify-block">
            <h4 className="amenity-lock-notify-title">Thông báo đối tác</h4>
            <AmenityPartnerNotifyFields
              compact
              label="Gửi thông báo sau khi xác nhận"
              notifyScope={notifyScope}
              onNotifyScopeChange={(key) => {
                setNotifyScope(key);
                if (notifyError) setNotifyError('');
              }}
              partnerId={partnerId}
              onPartnerIdChange={(value) => {
                setPartnerId(value);
                if (notifyError) setNotifyError('');
              }}
              partners={partners}
            />
            {notifyError && (
              <p className="field-error" style={{ marginTop: 8 }}>{notifyError}</p>
            )}
          </div>
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

export default AmenityLockConfirmModal;
