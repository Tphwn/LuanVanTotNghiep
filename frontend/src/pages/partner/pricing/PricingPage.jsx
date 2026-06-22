import { useEffect, useState } from 'react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

const LOAI_GIA = {
  co_ban:    { label: 'Cơ bản',    color: '#5a7a72'},
  cuoi_tuan: { label:'Cuối tuần', color: '#b36b00'},
  le_tet:    { label:'Lễ Tết',    color: '#e05c5c'},
  cao_diem:  { label:'Cao điểm',  color: '#7c3aed'},
};

const QUICK_ADJUST = [
  { label:'Cuối tuần +20%', pct: 1.2 },
  { label: 'Lễ Tết +50%',   pct: 1.5 },
  { label: 'Thấp điểm -15%', pct: 0.85 },
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));

const parseCurrency = (s) =>
  Number(String(s).replace(/\./g, '').replace(/,/g, ''));

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

const getDefaultLoaiGia = (dateStr) => {
  const d = new Date(dateStr).getDay();
  return d === 0 || d === 6 ? 'cuoi_tuan':'co_ban';
};

const PricingPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rooms, setRooms] = useState([]);

  const today = new Date().toISOString().slice(0, 10);
  const [tuNgay, setTuNgay] = useState(today);
  const [denNgay, setDenNgay] = useState(today);

  const [rows, setRows] = useState([]);

  const [viewRoom, setViewRoom] = useState('');
  const [calendar, setCalendar] = useState([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get('/partner/pricing/hotels').then((res) => {
      setHotels(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedHotel) {
      setRooms([]);
      setRows([]);
      return;
    }
    const hotel = hotels.find((h) => h.ma_khach_san === Number(selectedHotel));
    const r = hotel?.loai_phong || [];
    setRooms(r);
    setRows(r.map((room) => ({
      ma_loai_phong: room.ma_loai_phong,
      ten_loai: room.ten_loai,
      gia_co_ban: Number(room.gia_co_ban),
      checked: true,
      don_gia: Number(room.gia_co_ban),
    })));
    setViewRoom('');
    setCalendar([]);
  }, [selectedHotel, hotels]);

  const loadCalendar = async (maLoaiPhong, from, to) => {
    if (!maLoaiPhong) {
      setCalendar([]);
      return;
    }
    const room = rooms.find((r) => r.ma_loai_phong === Number(maLoaiPhong));
    const giaCoBan = Number(room?.gia_co_ban || 0);

    const res = await api.get('/partner/pricing/calendar', {
      params: { maLoaiPhong, tuNgay: from, denNgay: to },
    });

    const changedOnly = (res.data.data || []).filter(
      (c) => Number(c.don_gia) !== giaCoBan
    );
    setCalendar(changedOnly);
  };

  useEffect(() => {
    if (!viewRoom) {
      setCalendar([]);
      return;
    }
    loadCalendar(viewRoom, tuNgay, denNgay);
  }, [viewRoom, tuNgay, denNgay, rooms]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateRow = (maLoaiPhong, field, value) => {
    setRows((prev) => prev.map((r) =>
      r.ma_loai_phong === maLoaiPhong ? { ...r, [field]: value } : r
    ));
  };

  const applyQuickAdjust = (pct) => {
    setRows((prev) => prev.map((r) => ({
      ...r,
      don_gia: Math.round(r.gia_co_ban * pct),
    })));
  };

  const handleSave = async () => {
    const checkedRows = rows.filter((r) => r.checked);
    if (checkedRows.length === 0) return showToast('Chọn ít nhất 1 loại phòng', 'error');
    if (!tuNgay || !denNgay) return showToast('Chọn khoảng ngày', 'error');
    if (new Date(denNgay) < new Date(tuNgay)) {
      return showToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
    }

    const dates = getDatesInRange(tuNgay, denNgay);
    const entries = [];
    const toDelete = [];

    for (const row of checkedRows) {
      for (const ngay of dates) {
        if (Number(row.don_gia) !== Number(row.gia_co_ban)) {
          entries.push({
            ma_loai_phong: row.ma_loai_phong,
            ngay,
            don_gia: row.don_gia,
            loai_gia: getDefaultLoaiGia(ngay),
          });
        } else {
          toDelete.push({ ma_loai_phong: row.ma_loai_phong, ngay });
        }
      }
    }

    if (entries.length === 0 && toDelete.length === 0) {
      return showToast('Không có thay đổi giá nào so với giá cơ bản', 'error');
    }

    setSaving(true);
    try {
      if (entries.length > 0) {
        await api.post('/partner/pricing/save', { entries });
      }
      if (toDelete.length > 0) {
        await api.post('/partner/pricing/delete-bulk', { items: toDelete });
      }

      const changedCount = entries.length;
      showToast(
        changedCount > 0
          ? `Đã cập nhật giá cho ${checkedRows.length} loại phòng (${changedCount} ngày thay đổi)`
          : 'Đã khôi phục giá cơ bản cho khoảng ngày đã chọn');

      if (viewRoom) {
        await loadCalendar(viewRoom, tuNgay, denNgay);
      }
    } catch (err) {
      showToast(err.response?.data?.message ||'Lỗi lưu giá', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputSt = {
    padding: '9px 12px',
    border: '1px solid #d4ede6',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const viewRoomBase = rooms.find((r) => r.ma_loai_phong === Number(viewRoom))?.gia_co_ban;

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Giá"
        subtitle="Thiết lập giá theo khoảng thời gian cho từng loại phòng"
      />

      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success'?'#e8f5f1':'#fff0f0',
          border: `1px solid ${toast.type === 'success'?'#8FD9C4':'#ffb3b3'}`,
          color: toast.type === 'success'?'#3C7363':'#e05c5c',
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {toast.type === 'success'?'':''} {toast.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start'}}>

        <div>
          <div className="content-card"style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color:'#3C7363', marginBottom: 16 }}>
              1. Khách sạn & khoảng thời gian
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Khách sạn</label>
                <select
                  className="search-input"style={{ width: '100%'}}
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                >
                  <option value="">-- Chọn khách sạn --</option>
                  {hotels.map((h) => (
                    <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color:'#5a7a72', display: 'block', marginBottom: 4 }}>Khoảng ngày áp giá</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', border: '1px solid #d4ede6', borderRadius: 8, fontSize: 14,
                }}>
                  <input
                    type="date"value={tuNgay}
                    onChange={(e) => setTuNgay(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', flex: 1 }}
                  />
                  <span style={{ color: '#5a7a72'}}>đến</span>
                  <input
                    type="date"value={denNgay}
                    min={tuNgay}
                    onChange={(e) => setDenNgay(e.target.value)}
                    style={{ border:'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#3C7363', margin: 0 }}>
                  2. Cập nhật giá loại phòng
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                  {QUICK_ADJUST.map((qa) => (
                    <button
                      key={qa.label}
                      type="button"className="btn btn-ghost btn-sm"onClick={() => applyQuickAdjust(qa.pct)}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"checked={rows.every((r) => r.checked)}
                        onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, checked: e.target.checked })))}
                        style={{ marginRight: 8 }}
                      />
                      Loại phòng
                    </th>
                    <th>Giá cơ bản</th>
                    <th>Giá sau cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isChanged = Number(row.don_gia) !== Number(row.gia_co_ban);
                    return (
                      <tr key={row.ma_loai_phong}>
                        <td>
                          <div style={{ display:'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="checkbox"checked={row.checked}
                              onChange={(e) => updateRow(row.ma_loai_phong, 'checked', e.target.checked)}
                              style={{ accentColor: '#3C7363', width: 16, height: 16, cursor: 'pointer'}}
                            />
                            <span style={{ fontWeight: 500, color:'#1a2e28'}}>{row.ten_loai}</span>
                          </div>
                        </td>
                        <td style={{ color:'#5a7a72'}}>
                          {formatCurrency(row.gia_co_ban)} đ
                        </td>
                        <td>
                          <input
                            type="text"value={formatCurrency(row.don_gia)}
                            onChange={(e) => updateRow(row.ma_loai_phong,'don_gia', parseCurrency(e.target.value))}
                            disabled={!row.checked}
                            style={{
                              ...inputSt,
                              width: 160,
                              background: row.checked ? '#fff':'#f5f5f5',
                              color: isChanged ? '#b36b00':'#1a2e28',
                              fontWeight: isChanged ? 600 : 400,
                            }}
                          />
                          {isChanged && (
                            <span style={{ fontSize: 11, color: '#b36b00', marginLeft: 6 }}>
                              đã thay đổi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"className="btn btn-primary"onClick={handleSave}
                disabled={saving || rows.every((r) => !r.checked)}
                style={{ marginTop: 16, width: '100%', padding: '14px', justifyContent: 'center'}}
              >
                {saving ?'Đang lưu...':'Xác nhận & lưu giá'}
              </button>
            </div>
          )}

          {!selectedHotel && (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-state-text">Chọn khách sạn để bắt đầu quản lý giá</p>
              </div>
            </div>
          )}
        </div>

        <div className="content-card"style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>
            Lịch thay đổi giá
          </h3>
          <p style={{ fontSize: 12, color: '#5a7a72', marginBottom: 14 }}>
            Chỉ hiển thị các ngày có giá khác giá cơ bản
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
              Loại phòng
            </label>
            <select
              className="search-input"style={{ width: '100%'}}
              value={viewRoom}
              onChange={(e) => setViewRoom(e.target.value)}
            >
              <option value="">-- Chọn loại phòng --</option>
              {rooms.map((r) => (
                <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
              ))}
            </select>
          </div>

          {viewRoom && viewRoomBase != null && (
            <div style={{
              padding:'8px 12px', background: '#f8fdfb', borderRadius: 8,
              border: '1px solid #d4ede6', fontSize: 12, color: '#5a7a72', marginBottom: 12,
            }}>
              Giá cơ bản: <strong style={{ color: '#3C7363'}}>{formatCurrency(viewRoomBase)} đ</strong>
            </div>
          )}

          {!viewRoom ? (
            <div className="empty-state"style={{ padding:'24px 0'}}>
              <p className="empty-state-text">Chọn loại phòng để xem lịch thay đổi giá</p>
            </div>
          ) : calendar.length === 0 ? (
            <div style={{ textAlign:'center', padding: '24px 12px', color: '#5a7a72', fontSize: 13 }}>
              Chưa có thay đổi giá trong khoảng {tuNgay} → {denNgay}
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto'}}>
              {calendar.map((c) => {
                const loai = LOAI_GIA[c.loai_gia] || { label: c.loai_gia, color:'#5a7a72'};
                const d = new Date(c.ngay);
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                return (
                  <div
                    key={c.ma_bang_gia}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#fff',
                      borderRadius: 8,
                      marginBottom: 6,
                      border: '1px solid #e8f5f1',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: '#1a2e28'}}>
                        {dayNames[d.getDay()]}, {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                      </div>
                      <div style={{ fontSize: 11, color: loai.color }}>{loai.label}</div>
                    </div>
                    <div style={{ textAlign:'right'}}>
                      <div style={{ fontSize: 11, color:'#999', textDecoration: 'line-through'}}>
                        {formatCurrency(viewRoomBase)} đ
                      </div>
                      <div style={{ fontWeight: 700, color:'#b36b00', fontSize: 14 }}>
                        {formatCurrency(c.don_gia)} đ
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
