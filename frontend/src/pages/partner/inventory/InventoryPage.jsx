import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';

const TRANG_THAI = {
  dang_ban:  { label: 'Đang bán',   cls: 'badge-success'},
  dong_ban:  { label:'Đóng bán',   cls: 'badge-warning'},
  da_khoa:   { label:'Đã khóa',    cls: 'badge-danger'},
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hotels, setHotels] = useState([]);
  const [items, setItems] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [hotelFilter, setHotelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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
      setItems(data.items || []);
      setRoomTypes(data.roomTypes || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải dữ liệu kho phòng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.toast]);

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

  const handleEdit = (item) => {
    navigate(`/partner/inventory/${item.ma_loai_phong}/edit`, { state: { item } });
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
                        onClick={() => handleEdit(item)}
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
    </div>
  );
};

export default InventoryPage;
