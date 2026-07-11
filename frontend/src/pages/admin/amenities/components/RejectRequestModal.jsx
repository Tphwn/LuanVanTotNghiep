import ReasonField from '../../../../components/common/ReasonField';

export const RejectRequestModal = ({
  isOpen,
  rejectReason,
  onClose,
  onSubmit,
  onReasonChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Từ chối đề xuất</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14, color: '#5a7a72', marginBottom: 12 }}>
          Vui lòng nhập lý do từ chối để đối tác biết.
        </p>

        <ReasonField
          id="amenity-reject-reason"
          label="Lý do từ chối"
          required
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-danger" onClick={onSubmit}>Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
};
