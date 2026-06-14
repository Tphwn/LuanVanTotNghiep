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

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 14 }}>
    <span style={{ width: 160, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

// ===== DETAIL MODAL (Hiển thị View nhanh Khách sạn) =====
const HotelDetailModal = ({ hotel, onClose, onEdit, onToggle }) => {
  if (!hotel) return null;
  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const mainImg = hotel.hinh_anh?.find(i => i.la_anh_chinh === 1) || hotel.hinh_anh?.[0];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-box" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="modal-title" style={{ margin: 0, color: '#1a2e28' }}>🏨 {hotel.ten}</h3>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#e8f5f1', color: '#3C7363' }}>
            {st.label}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={onEdit}>✏️ Chỉnh sửa</button>
            {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
              <button style={{ background: hotel.trang_thai === 'hoat_dong' ? '#ffebee' : '#e8f5e9', color: hotel.trang_thai === 'hoat_dong' ? '#c62828' : '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={onToggle}>
                {hotel.trang_thai === 'hoat_dong' ? '🔒 Ngưng HĐ' : '🔓 Mở lại'}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <InfoRow label="Tên khách sạn"  value={hotel.ten} />
            <InfoRow label="Địa điểm"       value={hotel.dia_diem?.ten_dia_diem} />
            <InfoRow label="Xếp hạng"       value={`${hotel.so_sao} Sao`} />
          </div>
          <div>
            <InfoRow label="Giờ nhận phòng" value={hotel.gio_nhan_phong ? new Date(hotel.gio_nhan_phong).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'} />
            <InfoRow label="Giờ trả phòng"  value={hotel.gio_tra_phong ? new Date(hotel.gio_tra_phong).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'} />
            <InfoRow label="Trạng thái"     value={st.label} />
          </div>
        </div>

        <InfoRow label="Địa chỉ cụ thể" value={hotel.dia_chi} />

        {hotel.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {hotel.mo_ta}
          </div>
        )}

        {hotel.khach_san_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>🛎️ Tiện nghi chung</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hotel.khach_san_tien_nghi.map(tn => (
                <span key={tn.ma_tien_nghi} style={{ padding: '4px 12px', borderRadius: 20, background: '#e8f5f1', color: '#3C7363', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {tn.tien_nghi?.bieu_tuong} {tn.tien_nghi?.ten}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  
  const partnerHotelState = useSelector((state) => state.partnerHotel);
  const { list = [], diaDiem = [], amenities = [], defaultCancelPolicies = [], loading, error, successMsg } = partnerHotelState || {};

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
      const matchDiaDiem = diaDiemFilter === 'all' || String(hotel.ma_dia_diem) === diaDiemFilter;
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
      setModal(null);
    }
  };

  const handleSubmit = async (formData) => {
    if (modal === 'add') {
      const res = await dispatch(createHotel(formData));
      if (!res.error) setModal(null);
    } else {
      const hotelId = modal.ma_khach_san || modal.detail?.ma_khach_san;
      const res = await dispatch(updateHotel({ id: hotelId, data: formData }));
      if (!res.error) setModal(null);
    }
  };

  const getMainImage = (hotel) => {
    const imgs = hotel.hinh_anh || [];
    return imgs.find((img) => img.la_anh_chinh) || imgs[0];
  };

  return (
    <div className="main-panel" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: '#1a2e28', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Quản lý Khách sạn</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Danh sách cơ sở lưu trú của bạn</p>
        </div>
        <button style={{ background: '#3C7363', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setModal('add')}>
          + Thêm khách sạn mới
        </button>
      </div>

      {successMsg && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: '#e8f5f1', border: `1px solid #8FD9C4`, color: '#3C7363', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: '#fff0f0', border: `1px solid #ffb3b3`, color: '#e05c5c', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', borderTop: '4px solid #3C7363', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#888', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Tổng khách sạn</div>
          <div style={{ color: '#3C7363', fontSize: 24, fontWeight: 'bold' }}>{list.length}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', borderTop: '4px solid #52c41a', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#888', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Đang hoạt động</div>
          <div style={{ color: '#52c41a', fontSize: 24, fontWeight: 'bold' }}>{activeCount}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', borderTop: '4px solid #b36b00', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#888', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Chờ duyệt</div>
          <div style={{ color: '#b36b00', fontSize: 24, fontWeight: 'bold' }}>{pendingCount}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', borderTop: '4px solid #e05c5c', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#888', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Từ chối / Cần sửa</div>
          <div style={{ color: '#e05c5c', fontSize: 24, fontWeight: 'bold' }}>{rejectedCount}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          placeholder="🔍 Tìm tên khách sạn, địa chỉ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 2, padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <select
          value={diaDiemFilter}
          onChange={(e) => setDiaDiemFilter(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }}
        >
          <option value="all">Tất cả địa điểm</option>
          {diaDiem.map((d) => (
            <option key={d.ma_dia_diem} value={String(d.ma_dia_diem)}>{d.ten_dia_diem}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }}
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

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0, color: '#1a2e28', fontSize: '16px' }}>Danh sách cơ sở ({filteredList.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>⏳ Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏨</div>
            <p>{list.length ? 'Không có khách sạn phù hợp bộ lọc' : 'Chưa có khách sạn nào. Hãy thêm cơ sở đầu tiên!'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fdfb', color: '#5a7a72', fontSize: '14px' }}>
              <tr>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Khách sạn</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Địa điểm</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Sao</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Trạng thái</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((hotel) => {
                const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
                const thumb = getMainImage(hotel);

                return (
                  <tr key={hotel.ma_khach_san} style={{ borderBottom: '1px solid #eee', opacity: hotel.trang_thai === 'bi_khoa' ? 0.6 : 1 }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#e8f5f1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {thumb ? (
                            <img src={resolveUploadUrl(thumb.url)} alt={hotel.ten} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 20 }}>🏨</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1a2e28' }}>{hotel.ten}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hotel.dia_chi}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', fontSize: 14 }}>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                    <td style={{ padding: '15px 20px', color: '#f1c40f', fontSize: 14 }}>{'⭐'.repeat(hotel.so_sao || 0)}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span className={`badge ${st.cls}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      
                      {/* === TRẢ LẠI 3 NÚT ICON VUÔNG VỨC GIỐNG HỆT LOẠI PHÒNG === */}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          title="Xem chi tiết"
                          style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }} 
                          onClick={() => setModal({ detail: hotel })}
                        >
                          👁️
                        </button>
                        <button 
                          title="Chỉnh sửa"
                          style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }} 
                          onClick={() => setModal(hotel)}
                        >
                          ✏️
                        </button>
                        {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
                          <button 
                            title={hotel.trang_thai === 'hoat_dong' ? 'Ngưng hoạt động' : 'Mở lại'}
                            style={{ background: hotel.trang_thai === 'hoat_dong' ? '#ffebee' : '#e8f5e9', color: hotel.trang_thai === 'hoat_dong' ? '#c62828' : '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }} 
                            onClick={() => handleToggleStatus(hotel)}
                          >
                            {hotel.trang_thai === 'hoat_dong' ? '🔒' : '🔓'}
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

      {modal === 'add' && (
        <HotelFormModal hotel={null} diaDiem={diaDiem} amenities={amenities} defaultCancelPolicies={defaultCancelPolicies} onClose={() => setModal(null)} onSubmit={handleSubmit} loading={loading} />
      )}

      {modal && modal !== 'add' && !modal.detail && (
        <HotelFormModal hotel={modal} diaDiem={diaDiem} amenities={amenities} defaultCancelPolicies={defaultCancelPolicies} onClose={() => setModal(null)} onSubmit={handleSubmit} loading={loading} />
      )}

      {modal?.detail && (
        <HotelDetailModal 
          hotel={modal.detail} 
          onClose={() => setModal(null)} 
          onEdit={() => setModal(modal.detail)} 
          onToggle={() => handleToggleStatus(modal.detail)} 
        />
      )}
    </div>
  );
};

export default HotelsPage;