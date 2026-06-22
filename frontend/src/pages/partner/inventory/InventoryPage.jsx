import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

const INVENTORY_STATUS = {
  dang_ban: { label: 'Đang bán', cls: 'mgmt-status-text--active' },
  dong_ban: { label: 'Đóng bán', cls: 'mgmt-status-text--pending' },
  da_khoa: { label: 'Đã khóa', cls: 'mgmt-status-text--locked' },
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
    if (!window.confirm(`Đóng bán loại phòng "${item.ten_loai}"? Khách sẽ không đặt được phòng mới.`)) return;
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
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Kho phòng"
        subtitle="Theo dõi tồn kho và điều chỉnh số lượng phòng mở bán"
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mgmt-toolbar mgmt-toolbar--filters">
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label">Khách sạn</label>
          <select
            className="mgmt-select-inline"
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotels.map((h) => (
              <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
            ))}
          </select>
        </div>
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label">Loại phòng</label>
          <select
            className="mgmt-select-inline"
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
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        <div className="mgmt-table-card-header">
          <span className="mgmt-table-card-title">Danh sách kho phòng ({items.length})</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có dữ liệu kho phòng phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th>Loại phòng</th>
                  {!hotelFilter && <th>Khách sạn</th>}
                  <th style={{ width: 90 }}>Tổng phòng</th>
                  <th style={{ width: 80 }}>Đã đặt</th>
                  <th style={{ width: 80 }}>Còn lại</th>
                  <th style={{ width: 80 }}>Mở bán</th>
                  <th style={{ width: 110 }}>Trạng thái</th>
                  <th style={{ width: 120 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const st = INVENTORY_STATUS[item.trang_thai_hien_thi] || { label: item.trang_thai_hien_thi, cls: '' };
                  const canEdit = item.trang_thai_hien_thi !== 'da_khoa';
                  return (
                    <tr key={item.ma_loai_phong}>
                      <td>
                        <div className="mgmt-cell-name">{item.ten_loai}</div>
                      </td>
                      {!hotelFilter && (
                        <td style={{ fontSize: 13, color: '#64748b' }}>{item.ten_khach_san}</td>
                      )}
                      <td>{item.tong_phong}</td>
                      <td style={{ color: '#b36b00', fontWeight: 600 }}>{item.da_dat}</td>
                      <td style={{ color: item.con_lai > 0 ? '#1a7a4a' : '#e05c5c', fontWeight: 600 }}>
                        {item.con_lai}
                      </td>
                      <td style={{ fontWeight: 600, color: '#3C7363' }}>{item.mo_ban}</td>
                      <td>
                        <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                      </td>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
