import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { resolveUploadUrl } from '../../../utils/media';
import RoomFormModal from './RoomFormModal';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const TRANG_THAI = {
  hoat_dong: { label: 'Đang bán', cls: 'badge-success' },
  an:        { label: 'Đã ẩn',    cls: 'badge-danger'  },
};

const HOTEL_STATUS = {
  hoat_dong: { label: 'Hoạt động', cls: 'badge-success' },
  cho_duyet: { label: 'Chờ duyệt', cls: 'badge-warning' },
  da_duyet:  { label: 'Đã duyệt',  cls: 'badge-info' },
  bi_khoa:   { label: 'Ngưng HĐ',  cls: 'badge-danger' },
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 14 }}>
    <span style={{ width: 160, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

const getMainImage = (item) => {
  const imgs = item?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh === 1 || i.la_anh_chinh === true) || imgs[0];
};

// ===== DETAIL MODAL =====
const RoomDetailModal = ({ room, onClose, onEdit, onToggle }) => {
  if (!room) return null;
  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
  const mainImg = getMainImage(room);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🛏️ {room.ten_loai}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Chỉnh sửa</button>
            <button type="button" className={`btn btn-sm ${room.trang_thai === 'hoat_dong' ? 'btn-danger' : 'btn-primary'}`} onClick={onToggle}>
              {room.trang_thai === 'hoat_dong' ? '🔒 Ẩn phòng' : '🔓 Mở phòng'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <InfoRow label="Tên loại"       value={room.ten_loai} />
            <InfoRow label="Diện tích"      value={room.dien_tich ? `${room.dien_tich} m²` : '—'} />
            <InfoRow label="Sức chứa"       value={`${room.suc_chua} khách`} />
            <InfoRow label="Số giường"      value={`${room.so_giuong} giường`} />
          </div>
          <div>
            <InfoRow label="Số lượng phòng" value={`${room.so_luong_phong} phòng`} />
            <InfoRow label="Giá cơ bản"     value={`${fmt(room.gia_co_ban)} ₫/đêm`} />
            <InfoRow label="Trạng thái"     value={st.label} />
          </div>
        </div>

        {room.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {room.mo_ta}
          </div>
        )}

        {room.loai_phong_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>🛎️ Tiện nghi</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {room.loai_phong_tien_nghi.map((tn) => (
                <span key={tn.ma_tien_nghi} className="badge badge-info">
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

// ===== HOTEL PICKER CARD =====
const HotelPickerCard = ({ hotel, stats, selected, onSelect }) => {
  const thumb = getMainImage(hotel);
  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const isSelected = String(selected) === String(hotel.ma_khach_san);

  return (
    <button
      type="button"
      onClick={() => onSelect(hotel.ma_khach_san)}
      style={{
        textAlign: 'left', border: isSelected ? '2px solid #3C7363' : '1px solid #d4ede6',
        borderRadius: 14, overflow: 'hidden', background: '#fff', cursor: 'pointer',
        boxShadow: isSelected ? '0 4px 16px rgba(60,115,99,0.15)' : '0 1px 4px rgba(60,115,99,0.06)',
        transition: 'all 0.2s', padding: 0, width: '100%',
      }}
    >
      <div style={{ height: 120, background: '#e8f5f1', position: 'relative' }}>
        {thumb ? (
          <img src={resolveUploadUrl(thumb.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏨</div>
        )}
        <span className={`badge ${st.cls}`} style={{ position: 'absolute', top: 10, right: 10 }}>
          {st.label}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, color: '#1a2e28', fontSize: 15, marginBottom: 4 }}>{hotel.ten}</div>
        <div style={{ fontSize: 13, color: '#5a7a72', marginBottom: 10 }}>
          📍 {hotel.dia_diem?.ten_dia_diem || '—'}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <span style={{ color: '#3C7363', fontWeight: 600 }}>🛏️ {stats?.total ?? 0} loại phòng</span>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>✓ {stats?.active ?? 0} đang bán</span>
        </div>
      </div>
    </button>
  );
};

// ===== MAIN PAGE =====
const RoomTypePage = () => {
  const { hotelId: urlHotelId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels]           = useState([]);
  const [hotelStats, setHotelStats]   = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedHotel, setSelected]  = useState(urlHotelId || '');
  const [rooms, setRooms]             = useState([]);
  const [amenities, setAmenities]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [modal, setModal]             = useState(null);
  const [toast, setToast]             = useState(null);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [keyword, setKeyword]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectHotel = (id) => {
    const val = String(id);
    setSelected(val);
    setKeyword('');
    setStatusFilter('all');
    navigate(id ? `/partner/hotels/${id}/rooms` : '/partner/rooms');
  };

  const loadHotelStats = async (hotelList) => {
    const entries = await Promise.all(
      hotelList.map(async (h) => {
        try {
          const res = await api.get(`/partner/rooms?hotelId=${h.ma_khach_san}`);
          const list = res.data.data || [];
          return [h.ma_khach_san, {
            total: list.length,
            active: list.filter((r) => r.trang_thai === 'hoat_dong').length,
          }];
        } catch {
          return [h.ma_khach_san, { total: 0, active: 0 }];
        }
      })
    );
    setHotelStats(Object.fromEntries(entries));
  };

  useEffect(() => {
    const load = async () => {
      setLoadingHotels(true);
      try {
        const [hotelsRes, amenitiesRes] = await Promise.all([
          api.get('/partner/hotels'),
          api.get('/partner/hotels/amenities'),
        ]);
        const hotelList = hotelsRes.data.data || [];
        setHotels(hotelList);
        setAmenities(amenitiesRes.data.data || []);
        await loadHotelStats(hotelList);

        if (urlHotelId) {
          setSelected(urlHotelId);
        } else if (hotelList.length === 1) {
          selectHotel(hotelList[0].ma_khach_san);
        }
      } catch {
        showToast('Không tải được danh sách khách sạn', 'error');
      } finally {
        setLoadingHotels(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (urlHotelId) setSelected(urlHotelId);
  }, [urlHotelId]);

  useEffect(() => {
    if (!selectedHotel) {
      setRooms([]);
      return undefined;
    }

    let isMounted = true;
    const fetchRoomsData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/partner/rooms?hotelId=${selectedHotel}`);
        if (isMounted) setRooms(res.data.data || []);
      } catch {
        if (isMounted) setRooms([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoomsData();
    return () => { isMounted = false; };
  }, [selectedHotel, refreshKey]);

  const triggerReloadRooms = async () => {
    setRefreshKey((prev) => prev + 1);
    if (hotels.length) await loadHotelStats(hotels);
  };

  const handleToggle = async (room) => {
    const action = room.trang_thai === 'hoat_dong' ? 'ẩn' : 'mở';
    if (!window.confirm(`Xác nhận ${action} loại phòng "${room.ten_loai}"?`)) return;
    try {
      const newStatus = room.trang_thai === 'hoat_dong' ? 'an' : 'hoat_dong';
      await api.put(`/partner/rooms/${room.ma_loai_phong}`, { trang_thai: newStatus });
      showToast(`Đã ${action} loại phòng!`);
      triggerReloadRooms();
      setModal(null);
    } catch {
      showToast('Lỗi thao tác', 'error');
    }
  };

  const currentHotel = hotels.find((h) => h.ma_khach_san === Number(selectedHotel));
  const activeCount = rooms.filter((r) => r.trang_thai === 'hoat_dong').length;

  const overviewStats = useMemo(() => {
    const values = Object.values(hotelStats);
    return {
      hotels: hotels.length,
      roomTypes: values.reduce((s, v) => s + v.total, 0),
      active: values.reduce((s, v) => s + v.active, 0),
      hidden: values.reduce((s, v) => s + (v.total - v.active), 0),
    };
  }, [hotelStats, hotels.length]);

  const filteredRooms = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchStatus = statusFilter === 'all' || room.trang_thai === statusFilter;
      const matchKeyword = !text || room.ten_loai?.toLowerCase().includes(text);
      return matchStatus && matchKeyword;
    });
  }, [rooms, keyword, statusFilter]);

  if (loadingHotels) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>⏳ Đang tải dữ liệu...</div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Loại phòng</h1>
          <p className="page-subtitle">
            {currentHotel
              ? <>Đang quản lý loại phòng cho <strong>{currentHotel.ten}</strong></>
              : 'Chọn khách sạn để thêm, sửa loại phòng và tiện nghi'}
          </p>
        </div>
        {selectedHotel && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hotels.length > 1 && (
              <button type="button" className="btn btn-outline" onClick={() => selectHotel('')}>
                ← Chọn KS khác
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>
              + Thêm loại phòng
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0',
          border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`,
          color: toast.type === 'success' ? '#3C7363' : '#e05c5c',
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* ===== CHƯA CHỌN KHÁCH SẠN ===== */}
      {!selectedHotel && (
        <>
          <div className="stats-grid">
            {[
              { label: 'Khách sạn', value: overviewStats.hotels, color: '#3C7363' },
              { label: 'Tổng loại phòng', value: overviewStats.roomTypes, color: '#0958d9' },
              { label: 'Đang bán', value: overviewStats.active, color: '#52c41a' },
              { label: 'Đã ẩn', value: overviewStats.hidden, color: '#e05c5c' },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {hotels.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">🏨</div>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>
                  Bạn chưa có khách sạn nào. Hãy thêm khách sạn trước khi tạo loại phòng.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/partner/hotels')}>
                  + Thêm khách sạn
                </button>
              </div>
            </div>
          ) : (
            <div className="content-card">
              <div className="content-card-header">
                <h3 className="content-card-title">Chọn khách sạn để quản lý</h3>
                <span style={{ fontSize: 13, color: '#5a7a72' }}>{hotels.length} cơ sở</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {hotels.map((hotel) => (
                  <HotelPickerCard
                    key={hotel.ma_khach_san}
                    hotel={hotel}
                    stats={hotelStats[hotel.ma_khach_san]}
                    selected={selectedHotel}
                    onSelect={selectHotel}
                  />
                ))}
              </div>

              <div style={{
                marginTop: 24, padding: '16px 20px', background: '#f8fdfb',
                borderRadius: 12, border: '1px dashed #d4ede6',
              }}>
                <div style={{ fontWeight: 600, color: '#3C7363', marginBottom: 8, fontSize: 14 }}>💡 Hướng dẫn nhanh</div>
                <ol style={{ margin: 0, paddingLeft: 20, color: '#5a7a72', fontSize: 13, lineHeight: 1.8 }}>
                  <li>Chọn khách sạn từ danh sách trên</li>
                  <li>Thêm loại phòng với thông tin, giá và ảnh minh họa</li>
                  <li>Gắn tiện nghi riêng cho từng loại phòng</li>
                  <li>Quản lý giá tại mục <strong>Quản lý giá</strong>, kho phòng tại <strong>Kho phòng</strong></li>
                </ol>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== ĐÃ CHỌN KHÁCH SẠN ===== */}
      {selectedHotel && currentHotel && (
        <>
          {/* Hotel banner */}
          <div className="content-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ width: 140, minHeight: 100, background: '#e8f5f1', flexShrink: 0 }}>
                {getMainImage(currentHotel) ? (
                  <img
                    src={resolveUploadUrl(getMainImage(currentHotel).url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 100 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, minHeight: 100 }}>🏨</div>
                )}
              </div>
              <div style={{ flex: 1, padding: '16px 20px', minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#1a2e28' }}>{currentHotel.ten}</h3>
                  <span className={`badge ${(HOTEL_STATUS[currentHotel.trang_thai] || {}).cls || 'badge-default'}`}>
                    {(HOTEL_STATUS[currentHotel.trang_thai] || {}).label || currentHotel.trang_thai}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#5a7a72' }}>
                  📍 {currentHotel.dia_diem?.ten_dia_diem} — {currentHotel.dia_chi || 'Chưa cập nhật địa chỉ'}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#888' }}>⭐ {currentHotel.so_sao} sao</p>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: 16 }}>
            {[
              { label: 'Tổng loại phòng', value: rooms.length, color: '#3C7363' },
              { label: 'Đang bán', value: activeCount, color: '#52c41a' },
              { label: 'Đã ẩn', value: rooms.length - activeCount, color: '#e05c5c' },
              { label: 'Tổng số phòng', value: rooms.reduce((s, r) => s + (r.so_luong_phong || 0), 0), color: '#0958d9' },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="search-bar">
            <input
              className="search-input"
              placeholder="🔍 Tìm tên loại phòng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              className="search-input"
              style={{ flex: '0 0 180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="hoat_dong">Đang bán</option>
              <option value="an">Đã ẩn</option>
            </select>
            {hotels.length > 1 && (
              <select
                className="search-input"
                style={{ flex: '0 0 220px' }}
                value={selectedHotel}
                onChange={(e) => selectHotel(e.target.value)}
              >
                {hotels.map((h) => (
                  <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                ))}
              </select>
            )}
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách loại phòng ({filteredRooms.length})</h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>⏳ Đang tải dữ liệu...</div>
            ) : rooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛏️</div>
                <p className="empty-state-text" style={{ marginBottom: 16 }}>
                  Khách sạn này chưa có loại phòng nào
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>
                  + Thêm loại phòng đầu tiên
                </button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loại phòng</th>
                    <th>Diện tích</th>
                    <th>Sức chứa</th>
                    <th>Số lượng</th>
                    <th>Giá cơ bản</th>
                    <th>Tiện nghi</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => {
                    const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
                    const mainImg = getMainImage(room);
                    const amenityCount = room.loai_phong_tien_nghi?.length || 0;

                    return (
                      <tr key={room.ma_loai_phong} style={{ opacity: room.trang_thai === 'an' ? 0.65 : 1 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {mainImg ? (
                              <div style={{ width: 48, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                                <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{
                                width: 48, height: 40, borderRadius: 8, background: '#e8f5f1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
                              }}>🛏️</div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#1a2e28' }}>{room.ten_loai}</div>
                              <div style={{ fontSize: 12, color: '#5a7a72' }}>{room.so_giuong} giường</div>
                            </div>
                          </div>
                        </td>
                        <td>{room.dien_tich ? `${room.dien_tich} m²` : '—'}</td>
                        <td>{room.suc_chua} khách</td>
                        <td>{room.so_luong_phong} phòng</td>
                        <td style={{ fontWeight: 600, color: '#b36b00' }}>{fmt(room.gia_co_ban)} ₫</td>
                        <td>
                          <span className="badge badge-info">{amenityCount} tiện nghi</span>
                        </td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-ghost btn-sm" title="Xem chi tiết" onClick={() => setModal({ detail: room })}>👁️</button>
                            <button type="button" className="btn btn-ghost btn-sm" title="Chỉnh sửa" onClick={() => setModal(room)}>✏️</button>
                            <button
                              type="button"
                              className={`btn btn-sm ${room.trang_thai === 'hoat_dong' ? 'btn-danger' : 'btn-primary'}`}
                              title={room.trang_thai === 'hoat_dong' ? 'Ẩn phòng' : 'Mở phòng'}
                              onClick={() => handleToggle(room)}
                            >
                              {room.trang_thai === 'hoat_dong' ? '🔒' : '🔓'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {modal === 'add' && (
        <RoomFormModal
          room={null}
          hotelId={Number(selectedHotel)}
          amenities={amenities}
          onClose={() => setModal(null)}
          onSuccess={() => triggerReloadRooms()}
        />
      )}
      {modal && modal !== 'add' && !modal.detail && (
        <RoomFormModal
          room={modal}
          hotelId={Number(selectedHotel)}
          amenities={amenities}
          onClose={() => setModal(null)}
          onSuccess={() => triggerReloadRooms()}
        />
      )}
      {modal?.detail && (
        <RoomDetailModal
          room={modal.detail}
          onClose={() => setModal(null)}
          onEdit={() => setModal(modal.detail)}
          onToggle={() => { handleToggle(modal.detail); setModal(null); }}
        />
      )}
    </div>
  );
};

export default RoomTypePage;
