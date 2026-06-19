import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';

const TRANG_THAI = {
  dang_ban:  { label: 'Đang bán',   cls: 'badge-success'},
  dong_ban:  { label:'Đóng bán',   cls: 'badge-warning'},
  da_khoa:   { label:'Đã khóa',    cls: 'badge-danger'},
};

const EditOpenSaleModal = ({ item, onClose, onSave, saving }) => {
  const [qty, setQty] = useState(item?.mo_ban ?? 0);

  if (!item) return null;

  const max = item.tong_phong;
  const min = item.da_dat;

  return (
    <div className="modal-overlay"onClick={onClose}>
      <div className="modal-box"style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Điều chỉnh mở bán</h3>
          <button type="button"className="modal-close"onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14, color:'#5a7a72', marginBottom: 16 }}>
          <strong>{item.ten_loai}</strong> — {item.ten_khach_san}
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
          marginBottom: 16, fontSize: 13,
        }}>
          <div style={{ padding: 10, background: '#f8fdfb', borderRadius: 8, textAlign: 'center'}}>
            <div style={{ color:'#888'}}>Tổng phòng</div>
            <div style={{ fontWeight: 700, color:'#3C7363'}}>{item.tong_phong}</div>
          </div>
          <div style={{ padding: 10, background:'#fff8e6', borderRadius: 8, textAlign: 'center'}}>
            <div style={{ color:'#888'}}>Đã đặt</div>
            <div style={{ fontWeight: 700, color:'#b36b00'}}>{item.da_dat}</div>
          </div>
          <div style={{ padding: 10, background:'#e8f5f1', borderRadius: 8, textAlign: 'center'}}>
            <div style={{ color:'#888'}}>Còn lại</div>
            <div style={{ fontWeight: 700, color:'#1a7a4a'}}>{item.con_lai}</div>
          </div>
        </div>

        <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
          Số lượng mở bán
        </label>
        <input
          type="number"className="search-input"style={{ width: '100%', marginBottom: 8 }}
          min={min}
          max={max}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          Tối thiểu {min} (đã đặt), tối đa {max} (tổng phòng)
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
          <button type="button"className="btn btn-ghost"onClick={onClose}>Hủy</button>
          <button
            type="button"className="btn btn-primary"disabled={saving}
            onClick={() => onSave(Number(qty))}
          >
            {saving ?'Đang lưu...':'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState({ tong_so_phong: 0, so_loai_phong: 0, dang_mo_ban: 0, da_khoa: 0 });
  const [items, setItems] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [hotelFilter, setHotelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      if (roomFilter) params.ma_loai_phong = roomFilter;

      const res = await api.get('/partner/inventory', { params });
      const data = res.data.data || {};
      setStats(data.stats || {});
      setItems(data.items || []);
      setRoomTypes(data.roomTypes || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải dữ liệu kho phòng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/partner/inventory/hotels').then((res) => {
      setHotels(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [hotelFilter, roomFilter]);

  useEffect(() => {
    setRoomFilter('');
  }, [hotelFilter]);

  const handleUpdateOpenSale = async (qty) => {
    if (!editItem) return;
    setSaving(true);
    try {
      await api.put(`/partner/inventory/${editItem.ma_loai_phong}/open-sale`, {
        so_luong_mo_ban: qty,
      });
      showToast('Đã cập nhật số lượng mở bán');
      setEditItem(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSale = async (item) => {
    if (!window.confirm(`Đóng bán loại phòng"${item.ten_loai}"? Khách sẽ không đặt được phòng mới.`)) return;
    try {
      await api.put(`/partner/inventory/${item.ma_loai_phong}/close-sale`);
      showToast('Đã đóng bán');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleReopenSale = async (item) => {
    try {
      await api.put(`/partner/inventory/${item.ma_loai_phong}/reopen-sale`);
      showToast('Đã mở bán lại');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Kho phòng</h1>
          <p className="page-subtitle">Theo dõi tồn kho và điều chỉnh số lượng phòng mở bán</p>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.type === 'success'?'#e8f5f1':'#fff0f0',
          border: `1px solid ${toast.type === 'success'?'#8FD9C4':'#ffb3b3'}`,
          color: toast.type === 'success'?'#3C7363':'#e05c5c',
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === 'success'?'':''} {toast.msg}
        </div>
      )}

      <div className="stats-grid"style={{ marginBottom: 16 }}>
        {[
          { label: 'Tổng số phòng', value: stats.tong_so_phong, color: '#3C7363'},
          { label:'Số loại phòng', value: stats.so_loai_phong, color: '#0958d9'},
          { label:'Đang mở bán', value: stats.dang_mo_ban, color: '#52c41a'},
          { label:'Đã khóa', value: stats.da_khoa, color: '#e05c5c'},
        ].map((s) => (
          <div key={s.label} className="stat-card"style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value"style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="search-bar"style={{ marginBottom: 16 }}>
        <select
          className="search-input"style={{ flex: 1 }}
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
        >
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        <select
          className="search-input"style={{ flex: 1 }}
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          disabled={!hotelFilter}
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((r) => (
            <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
          ))}
        </select>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách kho phòng ({items.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding: 40, color: '#5a7a72'}}> Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có dữ liệu kho phòng phù hợp bộ lọc</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại phòng</th>
                {!hotelFilter && <th>Khách sạn</th>}
                <th>Tổng phòng</th>
                <th>Đã đặt</th>
                <th>Còn lại</th>
                <th>Mở bán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const st = TRANG_THAI[item.trang_thai_hien_thi] || { label: item.trang_thai_hien_thi, cls:'badge-default'};
                const canEdit = item.trang_thai_hien_thi !=='da_khoa';
                return (
                  <tr key={item.ma_loai_phong}>
                    <td style={{ fontWeight: 600 }}>{item.ten_loai}</td>
                    {!hotelFilter && <td>{item.ten_khach_san}</td>}
                    <td>{item.tong_phong}</td>
                    <td style={{ color: '#b36b00', fontWeight: 600 }}>{item.da_dat}</td>
                    <td style={{ color: item.con_lai > 0 ? '#1a7a4a':'#e05c5c', fontWeight: 600 }}>
                      {item.con_lai}
                    </td>
                    <td style={{ fontWeight: 600, color: '#3C7363'}}>{item.mo_ban}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <ActionCell>
                      <ActionButton
                        variant="edit"
                        iconOnly
                        icon={Pencil}
                        title="Sửa"
                        disabled={!canEdit}
                        onClick={() => setEditItem(item)}
                      />
                      <ActionButton
                        variant="lock"
                        iconOnly
                        icon={Lock}
                        title="Đóng bán"
                        disabled={item.trang_thai_hien_thi !== 'dang_ban'}
                        onClick={() => handleCloseSale(item)}
                      />
                      <ActionButton
                        variant="unlock"
                        iconOnly
                        icon={Unlock}
                        title="Mở bán"
                        disabled={item.trang_thai_hien_thi !== 'dong_ban'}
                        onClick={() => handleReopenSale(item)}
                      />
                    </ActionCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editItem && (
        <EditOpenSaleModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleUpdateOpenSale}
          saving={saving}
        />
      )}
    </div>
  );
};

export default InventoryPage;
