const PartnerHotelSubmitConfirmModal = ({
  isEdit,
  hotelName,
  loading,
  onClose,
  onConfirm,
}) => (
  <div className="modal-overlay" onClick={onClose} role="presentation">
    <div
      className="modal-box user-lock-confirm-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-header">
        <h3 className="modal-title">
          {isEdit ? 'Xác nhận lưu thay đổi' : 'Xác nhận gửi duyệt'}
        </h3>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
      </div>

      <div className="user-lock-confirm-modal-body">
        <p className="user-lock-confirm-modal-intro">
          {isEdit
            ? `Bạn có chắc muốn lưu thay đổi cho khách sạn "${hotelName || 'này'}"?`
            : `Bạn có chắc muốn gửi duyệt khách sạn "${hotelName || 'mới'}"? Hồ sơ sẽ được chuyển cho admin xem xét.`}
        </p>
      </div>

      <div className="user-lock-confirm-modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
          Hủy
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xử lý...' : (isEdit ? 'Lưu thay đổi' : 'Gửi duyệt')}
        </button>
      </div>
    </div>
  </div>
);

export default PartnerHotelSubmitConfirmModal;
