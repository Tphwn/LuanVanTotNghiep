import { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';

// ===== CONSTANTS =====
const LOAI_GIA = {
  co_ban:    { label: 'Cơ bản',    color: '#5a7a72' },
  cuoi_tuan: { label: 'Cuối tuần', color: '#b36b00' },
  le_tet:    { label: 'Lễ Tết',    color: '#e05c5c' },
  cao_diem:  { label: 'Cao điểm',  color: '#7c3aed' },
};

const QUICK_ADJUST = [
  { label: 'Cuối tuần +20%', loai: 'cuoi_tuan', pct: 1.2 },
  { label: 'Lễ Tết +50%',   loai: 'le_tet',    pct: 1.5 },
  { label: 'Thấp điểm -15%', loai: 'co_ban',   pct: 0.85 },
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));

const parseCurrency = (s) =>
  Number(String(s).replace(/\./g, '').replace(/,/g, ''));

// Tạo mảng ngày từ ngày bắt đầu đến kết thúc
const getDatesInRange = (from, to) => {
  const dates = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(new Date(cur).toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

// Xác định loại giá mặc định theo ngày
const getDefaultLoaiGia = (dateStr) => {
  const d = new Date(dateStr).getDay(); // 0=CN, 6=T7
  return d === 0 || d === 6 ? 'cuoi_tuan' : 'co_ban';
};

const PricingPage = () => {
  // ===== STATE =====
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rooms, setRooms] = useState([]);

  // Khoảng ngày áp giá
  const today = new Date().toISOString().slice(0, 10);
  const [tuNgay, setTuNgay] = useState(today);
  const [denNgay, setDenNgay] = useState(today);

  // Bảng giá — mỗi row là 1 loại phòng
  // { ma_loai_phong, checked, don_gia, so_luong }
  const [rows, setRows] = useState([]);

  // Panel xem lịch giá
  const [viewRoom, setViewRoom] = useState('');
  const [viewDate, setViewDate] = useState('');
  const [calendar, setCalendar] = useState([]);

  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  // ===== LOAD HOTELS =====
  useEffect(() => {
    api.get('/partner/pricing/hotels').then(res => {
      setHotels(res.data.data || []);
    });
  }, []);

  // Khi chọn KS → load loại phòng
  useEffect(() => {
    if (!selectedHotel) { setRooms([]); setRows([]); return; }
    const hotel = hotels.find(h => h.ma_khach_san === Number(selectedHotel));
    const r = hotel?.loai_phong || [];
    setRooms(r);
    setRows(r.map(room => ({
      ma_loai_phong: room.ma_loai_phong,
      ten_loai: room.ten_loai,
      gia_co_ban: Number(room.gia_co_ban),
      checked: true,
      don_gia: Number(room.gia_co_ban),
      so_luong: room.so_luong_phong,
    })));
  }, [selectedHotel, hotels]);

  // ===== LOAD CALENDAR =====
  useEffect(() => {
    if (!viewRoom) { setCalendar([]); return; }
    const from = tuNgay;
    const to = new Date(new Date(tuNgay).setDate(new Date(tuNgay).getDate() + 30))
      .toISOString().slice(0, 10);
    api.get('/partner/pricing/calendar', {
      params: { maLoaiPhong: viewRoom, tuNgay: from, denNgay: to },
    }).then(res => setCalendar(res.data.data || []));
  }, [viewRoom, tuNgay]);

  // ===== HELPERS =====
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateRow = (maLoaiPhong, field, value) => {
    setRows(prev => prev.map(r =>
      r.ma_loai_phong === maLoaiPhong ? { ...r, [field]: value } : r
    ));
  };

  // Áp giá nhanh theo %
  const applyQuickAdjust = (pct) => {
    setRows(prev => prev.map(r => ({
      ...r,
      don_gia: Math.round(r.gia_co_ban * pct),
    })));
  };

  // ===== SAVE =====
  const handleSave = async () => {
    const checkedRows = rows.filter(r => r.checked);
    if (checkedRows.length === 0) return showToast('Chọn ít nhất 1 loại phòng', 'error');
    if (!tuNgay || !denNgay) return showToast('Chọn khoảng ngày', 'error');
    if (new Date(denNgay) < new Date(tuNgay)) return showToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');

    const dates = getDatesInRange(tuNgay, denNgay);
    const entries = [];

    for (const row of checkedRows) {
      for (const ngay of dates) {
        entries.push({
          ma_loai_phong: row.ma_loai_phong,
          ngay,
          don_gia: row.don_gia,
          loai_gia: getDefaultLoaiGia(ngay),
        });
      }
    }

    setSaving(true);
    try {
      await api.post('/partner/pricing/save', { entries });
      showToast(`Đã lưu giá cho ${checkedRows.length} loại phòng × ${dates.length} ngày!`);
      // Reload calendar nếu đang xem
      if (viewRoom) {
        const res = await api.get('/partner/pricing/calendar', {
          params: { maLoaiPhong: viewRoom, tuNgay, denNgay },
        });
        setCalendar(res.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi lưu giá', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== STYLE =====
  const inputSt = {
    padding: '9px 12px', border: '1px solid #d4ede6',
    borderRadius: 8, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Giá & Kho phòng</h1>
          <p className="page-subtitle">Thiết lập chiến lược giá linh hoạt cùng lúc cho nhiều phòng</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0',
          border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`,
          color: toast.type === 'success' ? '#3C7363' : '#e05c5c',
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ===== CỘT TRÁI ===== */}
        <div>

          {/* BƯỚC 1: Chọn KS + khoảng ngày */}
          <div className="content-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#3C7363', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🛏️ 1. Khách sạn & Khoảng thời gian
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Chọn KS */}
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Khách sạn</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
                  value={selectedHotel}
                  onChange={e => setSelectedHotel(e.target.value)}
                >
                  <option value="">-- Chọn khách sạn --</option>
                  {hotels.map(h => (
                    <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                  ))}
                </select>
              </div>

              {/* Chọn ngày */}
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Khoảng ngày áp giá</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', border: '1px solid #d4ede6',
                  borderRadius: 8, fontSize: 14,
                }}>
                  <span>📅</span>
                  <input type="date" value={tuNgay}
                    onChange={e => setTuNgay(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
                  <span style={{ color: '#5a7a72' }}>đến</span>
                  <input type="date" value={denNgay} min={tuNgay}
                    onChange={e => setDenNgay(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 2: Bảng cập nhật giá */}
          {rows.length > 0 && (
            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#3C7363', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🛏️ 2. Cập nhật giá & phòng
                </h3>

                {/* Nút điều chỉnh nhanh */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {QUICK_ADJUST.map(qa => (
                    <button
                      key={qa.label}
                      onClick={() => applyQuickAdjust(qa.pct)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12,
                        border: 'none', cursor: 'pointer', fontWeight: 500,
                        background: qa.pct > 1 ? '#fff8e6' : '#e8f5f1',
                        color: qa.pct > 1 ? '#b36b00' : '#3C7363',
                      }}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f0f7f5' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#3C7363', fontWeight: 600, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={rows.every(r => r.checked)}
                        onChange={e => setRows(prev => prev.map(r => ({ ...r, checked: e.target.checked })))}
                        style={{ marginRight: 8 }}
                      />
                      Loại phòng (Giá gốc)
                    </th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#3C7363', fontWeight: 600, fontSize: 13 }}>Giá mới (VNĐ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#3C7363', fontWeight: 600, fontSize: 13 }}>Mở bán</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.ma_loai_phong} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={row.checked}
                            onChange={e => updateRow(row.ma_loai_phong, 'checked', e.target.checked)}
                            style={{ accentColor: '#3C7363', width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, color: '#1a2e28' }}>{row.ten_loai}</div>
                            <div style={{ fontSize: 12, color: '#5a7a72', textDecoration: 'line-through' }}>
                              {formatCurrency(row.gia_co_ban)}đ
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="text"
                          value={formatCurrency(row.don_gia)}
                          onChange={e => updateRow(row.ma_loai_phong, 'don_gia', parseCurrency(e.target.value))}
                          disabled={!row.checked}
                          style={{
                            ...inputSt, width: 160,
                            background: row.checked ? '#fff' : '#f5f5f5',
                            color: row.don_gia < row.gia_co_ban ? '#3C7363' : row.don_gia > row.gia_co_ban ? '#b36b00' : '#1a2e28',
                            fontWeight: 600,
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          value={row.so_luong}
                          onChange={e => updateRow(row.ma_loai_phong, 'so_luong', e.target.value)}
                          disabled={!row.checked}
                          min={0}
                          style={{
                            ...inputSt, width: 80, textAlign: 'center',
                            background: row.checked ? '#fff' : '#f5f5f5',
                            color: '#3C7363', fontWeight: 600,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Nút lưu */}
              <button
                onClick={handleSave}
                disabled={saving || rows.every(r => !r.checked)}
                style={{
                  marginTop: 16, width: '100%', padding: '14px',
                  background: saving ? '#ccc' : '#3C7363',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                💾 {saving ? 'Đang lưu...' : 'XÁC NHẬN & LƯU LỊCH GIÁ'}
              </button>
            </div>
          )}

          {!selectedHotel && (
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">🏨</div>
                <p className="empty-state-text">Chọn khách sạn để bắt đầu quản lý giá</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== CỘT PHẢI: Xem lịch giá ===== */}
        <div className="content-card" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#3C7363', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            📅 Xem lại lịch giá
          </h3>

          {/* Chọn loại phòng */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
              Chọn loại phòng cần xem
            </label>
            <select
              style={{ ...inputSt, width: '100%' }}
              value={viewRoom}
              onChange={e => setViewRoom(e.target.value)}
            >
              <option value="">-- Chọn loại phòng --</option>
              {rooms.map(r => (
                <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
              ))}
            </select>
          </div>

          {/* Lọc ngày */}
          {viewRoom && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
                Lọc theo ngày
              </label>
              <input
                type="date"
                value={viewDate}
                onChange={e => setViewDate(e.target.value)}
                style={{ ...inputSt, width: '100%' }}
              />
            </div>
          )}

          {/* Lịch giá */}
          {!viewRoom ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#5a7a72' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <p style={{ fontSize: 13 }}>Hãy chọn 1 loại phòng ở trên để kiểm tra lịch giá</p>
            </div>
          ) : calendar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#5a7a72', fontSize: 13 }}>
              Chưa có lịch giá đặc biệt nào
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {calendar
                .filter(c => !viewDate || c.ngay.slice(0, 10) === viewDate)
                .map(c => {
                  const loai = LOAI_GIA[c.loai_gia] || { label: c.loai_gia, color: '#5a7a72' };
                  const d = new Date(c.ngay);
                  const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={c.ma_bang_gia}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '10px 12px',
                        background: isWeekend ? '#fff8f0' : '#fff',
                        borderRadius: 8, marginBottom: 6,
                        border: '0.5px solid #f0f0f0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: '#1a2e28' }}>
                          {dayNames[d.getDay()]}, {d.getDate()}/{d.getMonth() + 1}
                        </div>
                        <div style={{ fontSize: 11, color: loai.color, fontWeight: 500 }}>
                          {loai.label}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#3C7363', fontSize: 14 }}>
                          {formatCurrency(c.don_gia)}đ
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;