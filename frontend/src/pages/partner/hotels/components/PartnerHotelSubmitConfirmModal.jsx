const PartnerHotelSubmitConfirmModal = ({
  needsApproval,
  hotelName,
  loading,
  onClose,
  onConfirm,
}) => {
  const title = needsApproval ? 'Xác nhận gửi duyệt' : 'Xác nhận lưu thay đổi';
  const intro = needsApproval
    ? `Bạn có chắc muốn gửi duyệt khách sạn "${hotelName || 'này'}"? Hồ sơ sẽ được chuyển cho admin xem xét.`
    : `Bạn có chắc muốn lưu thay đổi cho khách sạn "${hotelName || 'này'}"?`;
  const confirmText = needsApproval ? 'Gửi duyệt' : 'Lưu thay đổi';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box user-lock-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <p className="user-lock-confirm-modal-intro">{intro}</p>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerHotelSubmitConfirmModal;
