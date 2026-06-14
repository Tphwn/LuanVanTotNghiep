import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyHotels, fetchDiaDiem, fetchAmenitiesForHotel,
  createHotel, updateHotel, clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import { resolveUploadUrl } from '../../../utils/media';
import HotelFormModal from './HotelFormModal';

const TRANG_THAI = {
  cho_duyet:   { label: 'Chờ duyệt',    cls: 'badge-warning' },
  da_duyet:    { label: 'Đã duyệt',     cls: 'badge-info' },
  hoat_dong:   { label: 'Hoạt động',    cls: 'badge-success' },
  tu_choi:     { label: 'Từ chối',      cls: 'badge-danger' },
  yeu_cau_sua: { label: 'Cần sửa',      cls: 'badge-warning' },
  bi_khoa:     { label: 'Ngưng HĐ',     cls: 'badge-danger' },
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  const {
    list, diaDiem, amenities, defaultCancelPolicies,
    loading, error, successMsg,
  } = useSelector((s) => s.partnerHotel || {});

  const [modal, setModal] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [diaDiemFilter, setDiaDiemFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchMyHotels());
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, dispatch]);

  const filteredList = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return (list || []).filter((hotel) => {
      const matchDiaDiem = diaDiemFilter === 'all'
        || String(hotel.ma_dia_diem) === diaDiemFilter;
      const matchStatus = statusFilter === 'all' || hotel.trang_thai === statusFilter;
      const matchKeyword = !text
        || hotel.ten?.toLowerCase().includes(text)
        || hotel.dia_chi?.toLowerCase().includes(text)
        || hotel.dia_diem?.ten_dia_diem?.toLowerCase().includes(text);
      return matchDiaDiem && matchStatus && matchKeyword;
    });
  }, [list, keyword, diaDiemFilter, statusFilter]);

  const pendingCount  = (list || []).filter((h) => h.trang_thai === 'cho_duyet').length;
  const activeCount   = (list || []).filter((h) => h.trang_thai === 'hoat_dong').length;
  const rejectedCount = (list || []).filter((h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai)).length;

  const handleToggleStatus = (hotel) => {
    const isActivating = hotel.trang_thai === 'bi_khoa';
    const confirmMsg = isActivating
      ? `Bạn muốn MỞ LẠI hoạt động cho khách sạn "${hotel.ten}"?`
      : `Bạn có chắc chắn muốn TẠM NGƯNG khách sạn "${hotel.ten}"? Khách hàng sẽ không thể đặt phòng mới.`;

    if (window.confirm(confirmMsg)) {
      const newStatus = isActivating ? 'hoat_dong' : 'bi_khoa';
      dispatch(updateHotel({ id: hotel.ma_khach_san, data: { trang_thai: newStatus } }));
    }
  };

  const handleSubmit = async (formData) => {
    if (modal === 'add') {
      const res = await dispatch(createHotel(formData));
      if (!res.error) setModal(null);
    } else {
      const res = await dispatch(updateHotel({ id: modal.ma_khach_san, data: formData }));
      if (!res.error) setModal(null);
    }
  };

  const getMainImage = (hotel) => {
    const imgs = hotel.hinh_anh || [];
    return imgs.find((img) => img.la_anh_chinh) || imgs[0];
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Khách sạn</h1>
          <p className="page-subtitle">Danh sách cơ sở lưu trú của bạn</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          + Thêm khách sạn mới
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: '#e8f5f1', border: '1px solid #8FD9C4',
          color: '#3C7363', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #ffb3b3',
          color: '#e05c5c', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          ❌ {error}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { label: 'Tổng khách sạn', value: (list || []).length, color: '#3C7363' },
          { label: 'Đang hoạt động', value: activeCount, color: '#52c41a' },
          { label: 'Chờ duyệt', value: pendingCount, color: '#b36b00' },
          { label: 'Từ chối / Cần sửa', value: rejectedCount, color: '#e05c5c' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          className="search-input"
          placeholder="🔍 Tìm tên khách sạn, địa chỉ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 2 }}
        />
        <select
          className="search-input"
          value={diaDiemFilter}
          onChange={(e) => setDiaDiemFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="all">Tất cả địa điểm</option>
          {(diaDiem || []).map((d) => (
            <option key={d.ma_dia_diem} value={String(d.ma_dia_diem)}>
              {d.ten_dia_diem}
            </option>
          ))}
        </select>
        <select
          className="search-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="cho_duyet">Chờ duyệt</option>
          <option value="da_duyet">Đã duyệt</option>
          <option value="hoat_dong">Hoạt động</option>
          <option value="bi_khoa">Ngưng hoạt động</option>
          <option value="tu_choi">Từ chối</option>
          <option value="yeu_cau_sua">Cần sửa</option>
        </select>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            Danh sách cơ sở ({filteredList.length}{(list || []).length !== filteredList.length ? ` / ${(list || []).length}` : ''})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>⏳ Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏨</div>
            <p className="empty-state-text">
              {list?.length ? 'Không có khách sạn phù hợp bộ lọc' : 'Chưa có khách sạn nào. Hãy thêm cơ sở đầu tiên!'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách sạn</th>
                <th>Địa điểm</th>
                <th>Sao</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((hotel) => {
                const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
                const thumb = getMainImage(hotel);

                return (
                  <tr key={hotel.ma_khach_san} style={{ opacity: hotel.trang_thai === 'bi_khoa' ? 0.75 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                          background: '#e8f5f1', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {thumb ? (
                            <img
                              src={resolveUploadUrl(thumb.url)}
                              alt={hotel.ten}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: 20 }}>🏨</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1a2e28' }}>{hotel.ten}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{hotel.dia_chi}</div>
                        </div>
                      </div>
                    </td>
                    <td>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                    <td style={{ color: '#f1c40f' }}>{'⭐'.repeat(hotel.so_sao || 0)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setModal(hotel)}>
                          Sửa
                        </button>
                        {hotel.trang_thai === 'hoat_dong' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleToggleStatus(hotel)}>
                            Ngưng HĐ
                          </button>
                        )}
                        {hotel.trang_thai === 'bi_khoa' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleToggleStatus(hotel)}>
                            Mở lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <HotelFormModal
          hotel={modal === 'add' ? null : modal}
          diaDiem={diaDiem || []}
          amenities={amenities || []}
          defaultCancelPolicies={defaultCancelPolicies}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
};

export default HotelsPage;
