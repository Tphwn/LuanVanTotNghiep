import { useEffect, useState } from 'react';
import adminPartnerRequestService from '../../../../services/adminPartnerRequestService';

const STATUS_MAP = {
  cho_xu_ly: { label: 'Chờ xử lý', cls: 'badge-warning' },
  da_lien_he: { label: 'Đã liên hệ', cls: 'badge-info' },
  tu_choi: { label: 'Từ chối', cls: 'badge-danger' },
  da_hop_tac: { label: 'Đã hợp tác', cls: 'badge-success' },
};

const STATUS_OPTIONS = [
  { value: 'cho_xu_ly', label: 'Chờ xử lý' },
  { value: 'da_lien_he', label: 'Đã liên hệ' },
  { value: 'da_hop_tac', label: 'Đã hợp tác' },
  { value: 'tu_choi', label: 'Từ chối' },
];

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#334155' };

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f0f4f3', fontSize: 14 }}>
    <span style={{ width: 150, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <h4 style={{ margin: '18px 0 8px', fontSize: 14, fontWeight: 600, color: '#3C7363' }}>{children}</h4>
);

const PartnerRequestDetailModal = ({ isOpen, requestId, onClose, onUpdated }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [trangThai, setTrangThai] = useState('cho_xu_ly');
  const [phanHoi, setPhanHoi] = useState('');

  useEffect(() => {
    if (!isOpen || !requestId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminPartnerRequestService.getById(requestId);
        if (!active) return;
        const data = res.data?.data;
        setDetail(data);
        setTrangThai(data?.trang_thai || 'cho_xu_ly');
        setPhanHoi(data?.phan_hoi || '');
      } catch (err) {
        if (active) {
          setDetail(null);
          setError(err.response?.data?.message || 'Không thể tải chi tiết yêu cầu');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isOpen, requestId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await adminPartnerRequestService.updateStatus(requestId, {
        trang_thai: trangThai,
        phan_hoi: phanHoi.trim() || undefined,
      });
      setDetail(res.data?.data);
      onUpdated?.(res.data?.message || 'Đã cập nhật trạng thái');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const st = detail ? (STATUS_MAP[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' }) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {detail ? `Yêu cầu hợp tác #${detail.ma_yeu_cau}` : 'Chi tiết yêu cầu'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#5a7a72' }}>Đang tải chi tiết...</div>
        ) : !detail ? (
          <div style={{ padding: 16, color: '#e05c5c', fontSize: 14 }}>{error || 'Không tìm thấy yêu cầu'}</div>
        ) : (
          <>
            {error && (
              <div style={{
                background: '#fff0f0', border: '1px solid #ffb3b3', color: '#e05c5c',
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`badge ${st.cls}`}>{st.label}</span>
              <span style={{ fontSize: 12, color: '#5a7a72' }}>Gửi lúc {formatDateTime(detail.ngay_yeu_cau)}</span>
            </div>

            <SectionTitle>Thông tin người đại diện</SectionTitle>
            <InfoRow label="Họ và tên" value={detail.ho_ten} />
            <InfoRow label="Số điện thoại" value={detail.so_dien_thoai} />
            <InfoRow label="Email" value={detail.email} />

            <SectionTitle>Thông tin cơ sở lưu trú</SectionTitle>
            <InfoRow label="Tên khách sạn" value={detail.ten_co_so} />
            <InfoRow label="Quy mô số phòng" value={detail.quy_mo} />
            <InfoRow label="Tỉnh / Thành phố" value={detail.tinh_thanh} />
            <InfoRow label="Ghi chú" value={detail.ghi_chu || '—'} />

            <SectionTitle>Xử lý yêu cầu</SectionTitle>
            <InfoRow label="Ngày xử lý" value={formatDateTime(detail.ngay_xu_ly)} />
            <InfoRow label="Admin xử lý" value={detail.nguoi_dung?.email || '—'} />

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle} htmlFor="pr-trang-thai">Trạng thái</label>
              <select
                id="pr-trang-thai"
                className="search-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle} htmlFor="pr-phan-hoi">Phản hồi / ghi chú nội bộ</label>
              <textarea
                id="pr-phan-hoi"
                className="search-input"
                rows={3}
                value={phanHoi}
                onChange={(e) => setPhanHoi(e.target.value)}
                placeholder="Ghi chú khi liên hệ hoặc lý do từ chối..."
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Đóng</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerRequestDetailModal;
