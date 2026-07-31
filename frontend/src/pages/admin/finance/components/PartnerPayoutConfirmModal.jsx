import { useEffect, useState } from 'react';

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
  partnerId,
  partnerName,
  amount,
  soDon,
  loading,
  submitError,
  onClose,
  onConfirm,
}) => {
  const [maDot, setMaDot] = useState('');
  const [maGdNganHang, setMaGdNganHang] = useState('');
  const [noiDungCk, setNoiDungCk] = useState('');
  const [kyThanhToan, setKyThanhToan] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const id = Number(partnerId) || 0;
      setMaDot(`TT-${id}-${Date.now()}`);
      setMaGdNganHang('');
      setNoiDungCk('');
      setKyThanhToan('');
      setError('');
    }
  }, [open, partnerId]);

  if (!open) return null;

  const handleSubmit = () => {
    const bankCode = maGdNganHang.trim();
    const transferNote = noiDungCk.trim();

    if (!bankCode) {
      setError('Vui lòng nhập mã giao dịch ngân hàng');
      return;
    }
    if (!transferNote) {
      setError('Vui lòng nhập nội dung chuyển khoản');
      return;
    }
    if (kyThanhToan !== 'tuan' && kyThanhToan !== 'thang') {
      setError('Vui lòng chọn kỳ thanh toán theo tuần hoặc tháng');
      return;
    }

    setError('');
    onConfirm({
      ma_dot: maDot,
      ma_gd_ngan_hang: bankCode,
      noi_dung_chuyen_khoan: transferNote,
      ky_thanh_toan: kyThanhToan,
      phuong_thuc: 'chuyen_khoan',
    });
  };

  const displayError = error || submitError;

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div
        className="modal-box"
        style={{ maxWidth: 520 }}
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
            Mã đợt thanh toán
          </label>
          <input
            style={{ ...inputSt, background: '#f5f8f7', color: '#5a7a72', fontWeight: 600 }}
            value={maDot}
            readOnly
            disabled={loading}
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#7a9a92' }}>
            Mã được hệ thống tự sinh cho đợt thanh toán này.
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Mã giao dịch ngân hàng
            <span style={{ color: '#e05c5c' }}> *</span>
          </label>
          <input
            style={inputSt}
            value={maGdNganHang}
            disabled={loading}
            placeholder="Nhập mã giao dịch từ ngân hàng"
            onChange={(e) => setMaGdNganHang(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Nội dung chuyển khoản
            <span style={{ color: '#e05c5c' }}> *</span>
          </label>
          <textarea
            style={{ ...inputSt, resize: 'vertical', minHeight: 80 }}
            value={noiDungCk}
            disabled={loading}
            placeholder="VD: Thanh toan doi tac ABC tuan 29/2026"
            rows={3}
            onChange={(e) => setNoiDungCk(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', display: 'block', marginBottom: 6 }}>
            Kỳ thanh toán
            <span style={{ color: '#e05c5c' }}> *</span>
          </label>
          <select
            style={inputSt}
            value={kyThanhToan}
            disabled={loading}
            onChange={(e) => setKyThanhToan(e.target.value)}
          >
            <option value="">Chọn kỳ thanh toán</option>
            <option value="tuan">Theo tuần</option>
            <option value="thang">Theo tháng</option>
          </select>
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
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPayoutConfirmModal;
