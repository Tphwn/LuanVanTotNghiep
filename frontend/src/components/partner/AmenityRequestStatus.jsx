import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS = {
  cho_xu_ly: { label: 'Chờ duyệt', color: '#b36b00', bg: '#fff8e6' },
  da_tao: { label: 'Đã duyệt', color: '#1a7a4a', bg: '#e8f5f1' },
  tu_choi: { label: 'Từ chối', color: '#c0392b', bg: '#fff0f0' },
};

const LOAI = {
  khach_san: 'Khách sạn',
  phong: 'Loại phòng',
  ca_hai: 'Cả hai',
};

const matchesLoai = (r, loaiFilter) => {
  if (!loaiFilter) return true;
  if (r.loai_de_xuat) {
    return r.loai_de_xuat === loaiFilter || r.loai_de_xuat === 'ca_hai';
  }
  const moTa = (r.mo_ta || '').toLowerCase();
  if (loaiFilter === 'phong') {
    return moTa.includes('loại phòng') || moTa.includes('loai phong');
  }
  if (loaiFilter === 'khach_san') {
    return moTa.includes('khách sạn') || moTa.includes('khach san');
  }
  return true;
};

const matchesContext = (r, loaiFilter, contextId, contextName) => {
  if (!contextId && !contextName?.trim()) return false;

  const moTa = r.mo_ta || '';

  if (contextId) {
    if (loaiFilter === 'phong' && moTa.includes(`[loại phòng:${contextId}:`)) return true;
    if (loaiFilter === 'khach_san' && moTa.includes(`[khách sạn:${contextId}:`)) return true;
  }

  const name = contextName?.trim();
  if (name) {
    if (loaiFilter === 'phong') {
      if (moTa.includes(`[loại phòng:moi:${name}]`)) return true;
      if (moTa.includes(`cho loại phòng "${name}"`)) return true;
      if (moTa.includes(`cho loại phòng ${name}`)) return true;
    }
    if (loaiFilter === 'khach_san') {
      if (moTa.includes(`[khách sạn:moi:${name}]`)) return true;
      if (moTa.includes(`cho khách sạn "${name}"`)) return true;
      if (moTa.includes(`cho khách sạn ${name}`)) return true;
    }
  }

  return false;
};

/** Hiển thị yêu cầu tiện nghi của đối tác trong form KS / loại phòng */
const AmenityRequestStatus = ({
  loaiFilter,
  refreshKey = 0,
  contextId = null,
  contextName = '',
}) => {
  const [requests, setRequests] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    api.get('/partner/notifications/amenity-requests')
      .then((res) => setRequests(res.data.data || []))
      .catch(() => setRequests([]));
  }, [refreshKey]);

  const filtered = requests
    .filter((r) => matchesLoai(r, loaiFilter))
    .filter((r) => matchesContext(r, loaiFilter, contextId, contextName))
    .slice(0, 5);

  if (filtered.length === 0) return null;

  const pending = filtered.filter((r) => r.trang_thai === 'cho_xu_ly').length;

  return (
    <div style={{
      marginBottom: 14, borderRadius: 10, border: '1px solid #d4ede6',
      background: '#f8fdfb', overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#3C7363',
        }}
      >
        <span>Yêu cầu tiện nghi của bạn ({filtered.length})</span>
        <span style={{ fontSize: 12, color: '#888' }}>{expanded ? 'Thu gọn' : 'Mở rộng'}</span>
      </button>

      {pending > 0 && (
        <div style={{ padding: '0 14px 8px', fontSize: 12, color: '#b36b00' }}>
          {pending} yêu cầu đang chờ admin xử lý
        </div>
      )}

      {expanded && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r) => {
            const st = STATUS[r.trang_thai] || STATUS.cho_xu_ly;
            return (
              <div
                key={r.ma_yeu_cau}
                style={{
                  padding: '10px 12px', borderRadius: 8, background: '#fff',
                  border: '1px solid #e8f5f1', fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <strong style={{ color: '#1a2e28' }}>{r.ten_de_xuat}</strong>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    color: st.color, background: st.bg, whiteSpace: 'nowrap',
                  }}>
                    {st.label}
                  </span>
                </div>
                <div style={{ color: '#5a7a72' }}>
                  {r.loai_de_xuat ? LOAI[r.loai_de_xuat] : '—'}
                  {' · '}
                  {new Date(r.ngay_yeu_cau).toLocaleDateString('vi-VN')}
                </div>
                {r.trang_thai === 'tu_choi' && r.phan_hoi && (
                  <div style={{ marginTop: 6, color: '#c0392b' }}>Lý do: {r.phan_hoi}</div>
                )}
                {r.trang_thai === 'da_tao' && (
                  <div style={{ marginTop: 6, color: '#1a7a4a' }}>
                    Đã duyệt — admin sẽ thêm vào danh mục, bạn có thể chọn sau khi cập nhật
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AmenityRequestStatus;
