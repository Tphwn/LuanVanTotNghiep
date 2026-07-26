import { useEffect, useState } from 'react';
import { EyeOff, Eye, MessageSquareOff, MessageSquare } from 'lucide-react';
import ReasonField from '../../../../components/common/ReasonField';

const ACTION_CONFIG = {
  'hide-review': {
    icon: EyeOff,
    lockClass: 'is-lock',
    title: 'Xác nhận ẩn đánh giá',
    intro: 'Bạn có chắc muốn ẩn đánh giá này? Đánh giá sẽ không hiển thị công khai.',
    reasonLabel: 'Lý do ẩn',
    reasonHint: 'Lý do sẽ được gửi thông báo cho khách hàng và đối tác.',
    confirmText: 'Xác nhận ẩn',
    danger: true,
    needsReason: true,
  },
  'show-review': {
    icon: Eye,
    lockClass: 'is-unlock',
    title: 'Xác nhận mở đánh giá',
    intro: 'Bạn có chắc muốn mở lại đánh giá này? Khách hàng và đối tác sẽ được thông báo.',
    confirmText: 'Xác nhận mở',
    danger: false,
    needsReason: false,
  },
  'hide-response': {
    icon: MessageSquareOff,
    lockClass: 'is-lock',
    title: 'Xác nhận ẩn phản hồi đối tác',
    intro: 'Phản hồi sẽ không hiển thị với khách hàng. Chỉ đối tác nhận được lý do ẩn.',
    reasonLabel: 'Lý do ẩn phản hồi',
    reasonHint: 'Lý do chỉ gửi cho đối tác, khách hàng không thấy.',
    confirmText: 'Xác nhận ẩn phản hồi',
    danger: true,
    needsReason: true,
  },
  'show-response': {
    icon: MessageSquare,
    lockClass: 'is-unlock',
    title: 'Xác nhận hiện phản hồi đối tác',
    intro: 'Phản hồi của đối tác sẽ hiển thị lại cho khách hàng. Đối tác sẽ được thông báo.',
    confirmText: 'Xác nhận hiện phản hồi',
    danger: false,
    needsReason: false,
  },
};

const AdminReviewConfirmModal = ({
  review,
  action,
  loading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!review) return;
    setReason('');
    setError('');
  }, [review, action]);

  if (!review || !action) return null;

  const config = ACTION_CONFIG[action];
  if (!config) return null;

  const Icon = config.icon;

  const handleConfirm = () => {
    if (config.needsReason && !reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }
    onConfirm(config.needsReason ? reason.trim() : undefined);
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
            <span className={`user-lock-confirm-modal-icon ${config.lockClass}`}>
              <Icon size={20} />
            </span>
            <h3 className="modal-title">{config.title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">{config.intro}</p>

          <div className="user-lock-confirm-modal-info">
            <div className="user-lock-confirm-modal-row">
              <span>Mã đánh giá</span>
              <strong>#{review.ma_danh_gia}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Khách hàng</span>
              <strong>{review.khach_hang?.ho_ten || '—'}</strong>
            </div>
            <div className="user-lock-confirm-modal-row">
              <span>Khách sạn</span>
              <strong>{review.ten_khach_san || '—'}</strong>
            </div>
            {action.includes('response') && review.phan_hoi_doi_tac && (
              <div className="user-lock-confirm-modal-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <span>Phản hồi đối tác</span>
                <strong style={{ fontWeight: 500, lineHeight: 1.5 }}>{review.phan_hoi_doi_tac}</strong>
              </div>
            )}
          </div>

          {config.needsReason ? (
            <ReasonField
              id="review-hide-reason"
              label={config.reasonLabel}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              error={error}
              hint={config.reasonHint}
              placeholder="VD: Nội dung vi phạm chính sách, thông tin không chính xác..."
            />
          ) : null}
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            type="button"
            className={`btn ${config.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewConfirmModal;
