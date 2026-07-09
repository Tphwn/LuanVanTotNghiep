import { LogIn, LogOut } from 'lucide-react';

const FIELD_META = {
  gio_nhan_phong: {
    icon: LogIn,
    title: 'Xác nhận thay đổi giờ nhận phòng',
    label: 'Giờ nhận phòng (check-in)',
  },
  gio_tra_phong: {
    icon: LogOut,
    title: 'Xác nhận thay đổi giờ trả phòng',
    label: 'Giờ trả phòng (check-out)',
  },
};

const PartnerHotelTimeConfirmModal = ({
  field,
  newValue,
  oldValue,
  onClose,
  onConfirm,
}) => {
  if (!field || !newValue) return null;

  const meta = FIELD_META[field] || FIELD_META.gio_nhan_phong;
  const Icon = meta.icon;
  const isCheckIn = field === 'gio_nhan_phong';

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
            <span className={`user-lock-confirm-modal-icon${isCheckIn ? ' is-unlock' : ' is-lock'}`}>
              <Icon size={20} />
            </span>
            <h3 className="modal-title">{meta.title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">
            Bạn có chắc muốn đổi
            {' '}
            {meta.label.toLowerCase()}
            {' '}
            từ
            {' '}
            <strong>{oldValue}</strong>
            {' '}
            thành
            {' '}
            <strong>{newValue}</strong>
            ?
          </p>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerHotelTimeConfirmModal;
