import { useEffect, useState } from 'react';

const PAY_METHODS = [
  { value: 'chuyen_khoan', label: 'Chuyển khoản ngân hàng' },
  { value: 'tien_mat', label: 'Tiền mặt' },
  { value: 'khac', label: 'Khác' },
];

const inputSt = {
  padding: '9px 12px',
  border: '1px solid #d4ede6',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
  width: '100%',
};

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const PartnerPayoutConfirmModal = ({
  open,
  partnerName,
  amount,
  soDon,
  loading,
  submitError,
  onClose,
  onConfirm,
}) => {
  const [phuongThuc, setPhuongThuc] = useState('chuyen_khoan');
  const [ghiChu, setGhiChu] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPhuongThuc('chuyen_khoan');
      setGhiChu('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!phuongThuc) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }
    setError('');
    onConfirm({
      phuong_thuc: phuongThuc,
      ghi_chu: ghiChu.trim() || null,
    });
  };

  const displayError = error || submitError;

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div
        className="modal-box"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">Xác nhận thanh toán đối tác</h3>
          <button type="button" className="modal-close" disabled={loading} onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14, color: '#5a7a72', marginBottom: 14, lineHeight: 1.5 }}>
          Thanh toán một lần toàn bộ
          {' '}
          <strong style={{ color: '#1a2e28' }}>{soDon || 0} đơn</strong>
          {' '}
          đang chờ của đối tác
          {' '}
          <strong style={{ color: '#1a2e28' }}>{partnerName || '—'}</strong>
          .
          Hệ thống sẽ tạo mã thanh toán mới cho đợt này.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Số tiền thanh toán
          </label>
          <div style={{
            padding: '10px 12px',
            background: '#f0faf6',
            border: '1px solid #d4ede6',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            color: '#3C7363',
          }}
          >
            {fmt(amount)}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Phương thức thanh toán
            <span style={{ color: '#e05c5c' }}> *</span>
          </label>
          <select
            style={inputSt}
            value={phuongThuc}
            disabled={loading}
            onChange={(e) => setPhuongThuc(e.target.value)}
          >
            {PAY_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Ghi chú
          </label>
          <textarea
            style={{ ...inputSt, resize: 'vertical', minHeight: 80 }}
            value={ghiChu}
            disabled={loading}
            placeholder="VD: Đã chuyển khoản ngày 20/07/2026"
            rows={3}
            onChange={(e) => setGhiChu(e.target.value)}
          />
        </div>

        {displayError && (
          <div style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fff0f0',
            border: '1px solid #ffb3b3',
            color: '#e05c5c',
            fontSize: 13,
          }}
          >
            {displayError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPayoutConfirmModal;
