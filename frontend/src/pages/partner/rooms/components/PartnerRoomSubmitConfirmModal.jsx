const PartnerRoomSubmitConfirmModal = ({
  isEdit,
  roomName,
  loading,
  onClose,
  onConfirm,
}) => (
  <div className="modal-overlay" onClick={onClose} role="presentation">
    <div
      className="modal-box"
      style={{ maxWidth: 440 }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-header">
        <h3 className="modal-title">
          {isEdit ? 'Xác nhận cập nhật' : 'Xác nhận tạo loại phòng'}
        </h3>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
      </div>

      <div style={{ padding: '0 4px 8px', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
        {isEdit
          ? `Bạn có chắc muốn lưu thay đổi cho loại phòng "${roomName || 'này'}"?`
          : `Bạn có chắc muốn tạo loại phòng "${roomName || 'mới'}"?`}
      </div>

      <div className="user-lock-confirm-modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
          Hủy
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng')}
        </button>
      </div>
    </div>
  </div>
);

export default PartnerRoomSubmitConfirmModal;
