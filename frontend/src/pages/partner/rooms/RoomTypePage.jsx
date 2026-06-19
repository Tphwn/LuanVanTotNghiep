import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { resolveUploadUrl } from '../../../utils/media';
import {
  Pencil, Lock, Unlock, Plus, BedDouble, Building2,
  DollarSign, Maximize2, Users, FileText, Sparkles,
  Camera, Home, Check, Star,
} from 'lucide-react';
import RoomFormModal from './RoomFormModal';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const TRANG_THAI = {
  hoat_dong: { label: 'Đang hoạt động', cls: 'badge-success' },
  an:        { label: 'Đã ẩn',          cls: 'badge-danger'  },
};

const HOTEL_STATUS = {
  hoat_dong: { label: 'Hoạt động', cls: 'badge-success' },
  cho_duyet: { label: 'Chờ duyệt', cls: 'badge-warning' },
  da_duyet:  { label: 'Đã duyệt',  cls: 'badge-info'    },
  bi_khoa:   { label: 'Ngưng HĐ',  cls: 'badge-danger'  },
};

const getMainImage = (item) => {
  const imgs = item?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh === 1 || i.la_anh_chinh === true) || imgs[0];
};

/* ── RoomTypeCard ──────────────────────────────────────────────── */
const RoomTypeCard = ({ room, onEdit, onToggle, onManageImages }) => {
  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
  const isActive = room.trang_thai === 'hoat_dong';
  const allImgs = room.hinh_anh || [];
  const mainImg = getMainImage(room);
  const otherImgs = allImgs.filter((i) => i !== mainImg).slice(0, 3);

  return (
    <div className={`rt-card${!isActive ? ' rt-card-inactive' : ''}`}>
      {/* Header */}
      <div className="rt-card-header">
        <div className="rt-card-name-row">
          <Star size={13} strokeWidth={2.5} className="rt-card-star" />
          <span className="rt-card-name-label">LOẠI PHÒNG:</span>
          <strong className="rt-card-name">{room.ten_loai.toUpperCase()}</strong>
        </div>
        <div className="rt-card-header-right">
          <span className={`badge ${st.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {st.label}
            {isActive && <span className="rt-status-dot" />}
          </span>
          <button type="button" className="rt-action-btn rt-action-edit" onClick={onEdit}>
            <Pencil size={13} strokeWidth={2} /> Sửa
          </button>
          <button
            type="button"
            className={`rt-action-btn ${isActive ? 'rt-action-lock' : 'rt-action-unlock'}`}
            onClick={onToggle}
          >
            {isActive ? <Lock size={13} strokeWidth={2} /> : <Unlock size={13} strokeWidth={2} />}
            {isActive ? 'Ẩn' : 'Mở'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="rt-card-body">
        {/* Left – images */}
        <div className="rt-card-images">
          <div className="rt-main-img-wrap">
            {mainImg ? (
              <img src={resolveUploadUrl(mainImg.url)} alt={room.ten_loai} className="rt-main-img" />
            ) : (
              <div className="rt-main-img-empty">
                <BedDouble size={44} strokeWidth={1} />
                <span>Chưa có ảnh</span>
              </div>
            )}
            <button type="button" className="rt-change-img-btn" onClick={onManageImages}>
              <Camera size={12} /> Đổi ảnh
            </button>
          </div>
          <div className="rt-thumb-strip">
            {otherImgs.map((img, i) => (
              <div key={i} className="rt-thumb" onClick={onManageImages} role="button" tabIndex={0} onKeyDown={() => {}}>
                <img src={resolveUploadUrl(img.url)} alt="" />
              </div>
            ))}
            <button type="button" className="rt-thumb-add" onClick={onManageImages}>
              <Plus size={16} />
              <span style={{ fontSize: 10, marginTop: 2 }}>Thêm</span>
            </button>
          </div>
        </div>

        {/* Right – details */}
        <div className="rt-card-details">
          <div className="rt-detail-row rt-detail-price">
            <DollarSign size={15} strokeWidth={1.8} />
            <span><strong>Giá cơ bản:</strong> {fmt(room.gia_co_ban)} VNĐ / đêm</span>
          </div>
          <div className="rt-detail-row">
            <Maximize2 size={14} strokeWidth={1.8} />
            <span><strong>Diện tích:</strong> {room.dien_tich ? `${room.dien_tich} m²` : '—'}</span>
          </div>
          <div className="rt-detail-row">
            <Users size={14} strokeWidth={1.8} />
            <span><strong>Sức chứa:</strong> {room.suc_chua} người lớn</span>
          </div>
          <div className="rt-detail-row">
            <BedDouble size={14} strokeWidth={1.8} />
            <span><strong>Số giường:</strong> {room.so_giuong} giường</span>
          </div>
          <div className="rt-detail-row">
            <Home size={14} strokeWidth={1.8} />
            <span><strong>Số lượng phòng:</strong> {room.so_luong_phong} phòng</span>
          </div>
          {room.mo_ta && (
            <div className="rt-detail-row rt-detail-desc">
              <FileText size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Mô tả:</strong> {room.mo_ta}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      {(room.loai_phong_tien_nghi?.length > 0) && (
        <div className="rt-amenities-section">
          <div className="rt-section-label">
            <Sparkles size={12} strokeWidth={2} />
            TIỆN NGHI PHÒNG NÀY ĐANG CÓ:
          </div>
          <div className="rt-amenity-chips">
            {room.loai_phong_tien_nghi.map((tn) => (
              <span key={tn.ma_tien_nghi} className="rt-amenity-chip">
                <Check size={11} strokeWidth={2.5} />
                {tn.tien_nghi?.ten}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── HotelPickerCard ───────────────────────────────────────────── */
const HotelPickerCard = ({ hotel, stats, selected, onSelect }) => {
  const thumb = getMainImage(hotel);
  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const isSelected = String(selected) === String(hotel.ma_khach_san);

  return (
    <button
      type="button"
      onClick={() => onSelect(hotel.ma_khach_san)}
      className={`hotel-picker-card${isSelected ? ' selected' : ''}`}
    >
      <div className="hotel-picker-thumb">
        {thumb ? (
          <img src={resolveUploadUrl(thumb.url)} alt="" />
        ) : (
          <Building2 size={36} strokeWidth={1} style={{ color: '#3C7363' }} />
        )}
        <span className={`badge ${st.cls}`} style={{ position: 'absolute', top: 8, right: 8 }}>
          {st.label}
        </span>
      </div>
      <div className="hotel-picker-info">
        <div className="hotel-picker-name">{hotel.ten}</div>
        <div className="hotel-picker-location">{hotel.dia_diem?.ten_dia_diem || '—'}</div>
        <div className="hotel-picker-stats">
          <span style={{ color: '#3C7363', fontWeight: 600 }}>{stats?.total ?? 0} loại phòng</span>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{stats?.active ?? 0} đang bán</span>
        </div>
      </div>
    </button>
  );
};

/* ── Main Page ─────────────────────────────────────────────────── */
const RoomTypePage = () => {
  const { hotelId: urlHotelId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels]             = useState([]);
  const [hotelStats, setHotelStats]     = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedHotel, setSelected]    = useState(urlHotelId || '');
  const [rooms, setRooms]               = useState([]);
  const [amenities, setAmenities]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [modal, setModal]               = useState(null);
  const [toast, setToast]               = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [keyword, setKeyword]           = useState('');
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
    if (!selectedHotel) { setRooms([]); return undefined; }
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
  const activeCount  = rooms.filter((r) => r.trang_thai === 'hoat_dong').length;

  const overviewStats = useMemo(() => {
    const values = Object.values(hotelStats);
    return {
      hotels:    hotels.length,
      roomTypes: values.reduce((s, v) => s + v.total, 0),
      active:    values.reduce((s, v) => s + v.active, 0),
      hidden:    values.reduce((s, v) => s + (v.total - v.active), 0),
    };
  }, [hotelStats, hotels.length]);

  const filteredRooms = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchStatus  = statusFilter === 'all' || room.trang_thai === statusFilter;
      const matchKeyword = !text || room.ten_loai?.toLowerCase().includes(text);
      return matchStatus && matchKeyword;
    });
  }, [rooms, keyword, statusFilter]);

  const filterTabs = [
    { id: 'all',       label: 'Tất cả',      count: rooms.length },
    { id: 'hoat_dong', label: 'Đang bán',    count: activeCount },
    { id: 'an',        label: 'Đã ẩn',       count: rooms.length - activeCount },
  ];

  if (loadingHotels) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <ManagementHeader
        title="Quản lý Loại phòng"
        subtitle={
          currentHotel
            ? `Đang quản lý loại phòng cho ${currentHotel.ten}`
            : 'Chọn khách sạn để thêm, sửa loại phòng và tiện nghi'
        }
        actionLabel={selectedHotel ? '+ Thêm loại phòng' : undefined}
        onAction={selectedHotel ? () => setModal('add') : undefined}
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 16 }}>
          {toast.msg}
        </div>
      )}

      {/* ── Chưa chọn khách sạn ── */}
      {!selectedHotel && (
        <>
          <div className="mgmt-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Khách sạn',      value: overviewStats.hotels,    color: '#3C7363' },
              { label: 'Tổng loại phòng', value: overviewStats.roomTypes, color: '#0958d9' },
              { label: 'Đang bán',        value: overviewStats.active,    color: '#52c41a' },
              { label: 'Đã ẩn',           value: overviewStats.hidden,    color: '#e05c5c' },
            ].map((s) => (
              <div key={s.label} className="mgmt-stat-card">
                <div className="mgmt-stat-label">{s.label}</div>
                <div className="mgmt-stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {hotels.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
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
            </div>
          )}
        </>
      )}

      {/* ── Đã chọn khách sạn ── */}
      {selectedHotel && currentHotel && (
        <>
          {/* Hotel banner */}
          <div className="rt-hotel-banner">
            {getMainImage(currentHotel) ? (
              <img src={resolveUploadUrl(getMainImage(currentHotel).url)} alt="" className="rt-hotel-banner-img" />
            ) : (
              <div className="rt-hotel-banner-placeholder">
                <Building2 size={28} strokeWidth={1.2} />
              </div>
            )}
            <div className="rt-hotel-banner-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1a2e28' }}>{currentHotel.ten}</h3>
                <span className={`badge ${(HOTEL_STATUS[currentHotel.trang_thai] || {}).cls || 'badge-default'}`}>
                  {(HOTEL_STATUS[currentHotel.trang_thai] || {}).label || currentHotel.trang_thai}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5a7a72' }}>
                {currentHotel.dia_diem?.ten_dia_diem} — {currentHotel.dia_chi || 'Chưa cập nhật địa chỉ'}
              </p>
            </div>
            {hotels.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => selectHotel('')}>
                ← Đổi khách sạn
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mgmt-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Tổng loại phòng', value: rooms.length,                                            color: '#3C7363' },
              { label: 'Đang bán',         value: activeCount,                                             color: '#52c41a' },
              { label: 'Đã ẩn',            value: rooms.length - activeCount,                             color: '#e05c5c' },
              { label: 'Tổng số phòng',    value: rooms.reduce((s, r) => s + (r.so_luong_phong || 0), 0), color: '#0958d9' },
            ].map((s) => (
              <div key={s.label} className="mgmt-stat-card">
                <div className="mgmt-stat-label">{s.label}</div>
                <div className="mgmt-stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="mgmt-toolbar" style={{ marginBottom: 16 }}>
            <SearchBar
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên loại phòng..."
            />
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

          <FilterTabs tabs={filterTabs} active={statusFilter} onChange={setStatusFilter} />

          {/* Room cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
          ) : rooms.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-state-text" style={{ marginBottom: 16 }}>
                  Khách sạn này chưa có loại phòng nào
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setModal('add')}>
                  + Thêm loại phòng đầu tiên
                </button>
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
              </div>
            </div>
          ) : (
            <div className="rt-card-list">
              {filteredRooms.map((room) => (
                <RoomTypeCard
                  key={room.ma_loai_phong}
                  room={room}
                  onEdit={() => setModal(room)}
                  onToggle={() => handleToggle(room)}
                  onManageImages={() => navigate(`/partner/rooms/${room.ma_loai_phong}/images`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
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
    </div>
  );
};

export default RoomTypePage;
