import { useState } from 'react';

const RespondModal = ({ review, onClose, onSave, saving }) => {
  const [text, setText] = useState(review?.phan_hoi_doi_tac || '');

  if (!review) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{review.da_phan_hoi ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
          Nội dung phản hồi
        </label>
        <textarea
          className="search-input"
          rows={4}
          style={{ width: '100%', resize: 'vertical', marginBottom: 16 }}
          placeholder="Cảm ơn quý khách đã lưu trú..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || !text.trim()}
            onClick={() => onSave(text.trim())}
          >
            {saving ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RespondModal;
