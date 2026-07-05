import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';

const LOAI_GIAM = {
  phan_tram: 'Phần trăm (%)',
  so_tien: 'Số tiền (VNĐ)',
};

const TRANG_THAI = {
  hoat_dong: { label: 'Đang hoạt động', cls: 'mgmt-status-text--active' },
  het_han: { label: 'Hết hạn', cls: 'mgmt-status-text--pending' },
  an: { label: 'Đã ẩn', cls: 'mgmt-status-text--locked' },
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const emptyForm = {
  ma_khach_san: '',
  ma_code: '',
  ten: '',
  loai_giam: 'phan_tram',
  gia_tri: '',
  giam_toi_da: '',
  don_hang_toi_thieu: '0',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  so_luot_toi_da: '',
};

const PartnerPromotionsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [items, setItems] = useState([]);
  const [hotelFilter, setHotelFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      const res = await api.get('/partner/promotions', { params });
      setItems(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải khuyến mãi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/partner/promotions/hotels').then((res) => {
      setHotels(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadPromotions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.trang_thai === 'hoat_dong').length,
    hidden: items.filter((i) => i.trang_thai === 'an').length,
  }), [items]);

  const hasActiveFilter = Boolean(hotelFilter);

  const clearFilters = () => {
    setHotelFilter('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      ma_khach_san: hotelFilter || (hotels[0] ? String(hotels[0].ma_khach_san) : ''),
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ma_khach_san: String(item.ma_khach_san || ''),
      ma_code: item.ma_code,
      ten: item.ten,
      loai_giam: item.loai_giam,
      gia_tri: String(item.gia_tri),
      giam_toi_da: item.giam_toi_da != null ? String(item.giam_toi_da) : '',
      don_hang_toi_thieu: String(item.don_hang_toi_thieu || 0),
      ngay_bat_dau: item.ngay_bat_dau?.slice?.(0, 10) || '',
      ngay_ket_thuc: item.ngay_ket_thuc?.slice?.(0, 10) || '',
      so_luot_toi_da: item.so_luot_toi_da != null ? String(item.so_luot_toi_da) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ma_khach_san || !form.ma_code || !form.ten) {
      return showToast('Vui lòng điền đủ thông tin', 'error');
    }

    setSaving(true);
    try {
      const payload = {
        ma_khach_san: Number(form.ma_khach_san),
        ma_code: form.ma_code,
        ten: form.ten,
        loai_giam: form.loai_giam,
        gia_tri: Number(form.gia_tri),
        giam_toi_da: form.giam_toi_da ? Number(form.giam_toi_da) : null,
        don_hang_toi_thieu: Number(form.don_hang_toi_thieu || 0),
        ngay_bat_dau: form.ngay_bat_dau,
        ngay_ket_thuc: form.ngay_ket_thuc,
        so_luot_toi_da: form.so_luot_toi_da ? Number(form.so_luot_toi_da) : null,
      };

      if (editing) {
        await api.put(`/partner/promotions/${editing.ma_khuyen_mai}`, payload);
        showToast('Đã cập nhật khuyến mãi');
      } else {
        await api.post('/partner/promotions', payload);
        showToast('Đã tạo khuyến mãi');
      }

      setModalOpen(false);
      loadPromotions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi lưu khuyến mãi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item) => {
    const next = item.trang_thai === 'hoat_dong' ? 'an' : 'hoat_dong';
    const msg = next === 'an'
      ? `Ẩn khuyến mãi "${item.ten}"?`
      : `Kích hoạt lại khuyến mãi "${item.ten}"?`;
    if (!window.confirm(msg)) return;

    try {
      await api.put(`/partner/promotions/${item.ma_khuyen_mai}`, { trang_thai: next });
      showToast(next === 'an' ? 'Đã ẩn khuyến mãi' : 'Đã kích hoạt khuyến mãi');
      loadPromotions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật', 'error');
    }
  };

  const formatGiaTri = (item) => {
    if (item.loai_giam === 'phan_tram') return `${item.gia_tri}%`;
    return `${formatCurrency(item.gia_tri)} đ`;
  };

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Khuyến mãi"
        subtitle="Tạo và quản lý mã giảm giá cho khách sạn của bạn"
        actionLabel="Tạo khuyến mãi"
        onAction={openCreate}
      />

      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0',
          border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`,
          color: toast.type === 'success' ? '#3C7363' : '#e05c5c',
          fontSize: 14, fontWeight: 500,
        }}
        >
          {toast.msg}
        </div>
      )}

      <div className="mgmt-toolbar" style={{ marginBottom: 16 }}>
        <select
          className="search-input"
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
        >
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        )}
        <span style={{ fontSize: 13, color: '#5a7a72', marginLeft: 'auto' }}>
          {stats.active} đang hoạt động / {stats.total} mã
        </span>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="empty-state"><p className="empty-state-text">Đang tải...</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có khuyến mãi nào</p>
            <button type="button" className="btn btn-primary" onClick={openCreate} style={{ marginTop: 12 }}>
              Tạo khuyến mãi đầu tiên
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên chương trình</th>
                <th>Khách sạn</th>
                <th>Giảm</th>
                <th>Thời hạn</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const st = TRANG_THAI[item.trang_thai] || { label: item.trang_thai, cls: '' };
                return (
                  <tr key={item.ma_khuyen_mai}>
                    <td><strong>{item.ma_code}</strong></td>
                    <td>{item.ten}</td>
                    <td>{item.khach_san?.ten || '—'}</td>
                    <td>{formatGiaTri(item)}</td>
                    <td>{formatDate(item.ngay_bat_dau)} – {formatDate(item.ngay_ket_thuc)}</td>
                    <td>
                      {item.so_luot_da_dung}
                      {item.so_luot_toi_da != null ? ` / ${item.so_luot_toi_da}` : ''}
                    </td>
                    <td><span className={`mgmt-status-text ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <ActionCell>
                        <ActionButton icon={Pencil} label="Sửa" onClick={() => openEdit(item)} />
                        <ActionButton
                          label={item.trang_thai === 'hoat_dong' ? 'Ẩn' : 'Bật'}
                          onClick={() => toggleStatus(item)}
                        />
                      </ActionCell>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 className="modal-title">{editing ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Khách sạn</label>
                <select
                  className="search-input"
                  value={form.ma_khach_san}
                  onChange={(e) => setForm({ ...form, ma_khach_san: e.target.value })}
                  required
                  disabled={!!editing}
                >
                  <option value="">-- Chọn --</option>
                  {hotels.map((h) => (
                    <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mã khuyến mãi</label>
                <input
                  className="search-input"
                  value={form.ma_code}
                  onChange={(e) => setForm({ ...form, ma_code: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editing}
                  placeholder="VD: SUMMER26"
                />
              </div>
              <div className="form-group">
                <label>Tên chương trình</label>
                <input
                  className="search-input"
                  value={form.ten}
                  onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Loại giảm</label>
                  <select
                    className="search-input"
                    value={form.loai_giam}
                    onChange={(e) => setForm({ ...form, loai_giam: e.target.value })}
                  >
                    {Object.entries(LOAI_GIAM).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá trị</label>
                  <input
                    className="search-input"
                    type="number"
                    min={0}
                    value={form.gia_tri}
                    onChange={(e) => setForm({ ...form, gia_tri: e.target.value })}
                    required
                  />
                </div>
              </div>
              {form.loai_giam === 'phan_tram' && (
                <div className="form-group">
                  <label>Giảm tối đa (VNĐ)</label>
                  <input
                    className="search-input"
                    type="number"
                    min={0}
                    value={form.giam_toi_da}
                    onChange={(e) => setForm({ ...form, giam_toi_da: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Đơn tối thiểu (VNĐ)</label>
                <input
                  className="search-input"
                  type="number"
                  min={0}
                  value={form.don_hang_toi_thieu}
                  onChange={(e) => setForm({ ...form, don_hang_toi_thieu: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Từ ngày</label>
                  <input
                    className="search-input"
                    type="date"
                    value={form.ngay_bat_dau}
                    onChange={(e) => setForm({ ...form, ngay_bat_dau: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đến ngày</label>
                  <input
                    className="search-input"
                    type="date"
                    value={form.ngay_ket_thuc}
                    min={form.ngay_bat_dau}
                    onChange={(e) => setForm({ ...form, ngay_ket_thuc: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Số lượt tối đa (để trống = không giới hạn)</label>
                <input
                  className="search-input"
                  type="number"
                  min={1}
                  value={form.so_luot_toi_da}
                  onChange={(e) => setForm({ ...form, so_luot_toi_da: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerPromotionsPage;
