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

        <textarea
          rows={4}
          placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid #d4ede6',
            borderRadius: 8, fontSize: 14, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-danger" onClick={onSubmit}>Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
};
