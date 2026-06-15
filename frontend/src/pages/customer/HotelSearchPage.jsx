import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'stars_desc', label: 'Hạng sao cao nhất' },
];

const STAR_OPTIONS = [5, 4, 3, 2, 1];

const buildRoomDetailUrl = (hotelId, roomId, filters) => {
  const params = new URLSearchParams();
  if (filters.ma_dia_diem) params.set('ma_dia_diem', filters.ma_dia_diem);
  if (filters.ngay_nhan) params.set('ngay_nhan', filters.ngay_nhan);
  if (filters.ngay_tra) params.set('ngay_tra', filters.ngay_tra);
  if (filters.so_khach) params.set('so_khach', filters.so_khach);
  const qs = params.toString();
  return `/hotels/${hotelId}/rooms/${roomId}${qs ? `?${qs}` : ''}`;
};

const clampMinZero = (raw) => {
  if (raw === '') return '';
  const num = Number(raw);
  if (Number.isNaN(num)) return '';
  return String(Math.max(0, Math.floor(num)));
};

const getRoomImage = (room) => {
  const roomImg = room.hinh_anh?.find((i) => i.la_anh_chinh) || room.hinh_anh?.[0];
  if (roomImg) return roomImg;
  const hotelImgs = room.khach_san?.hinh_anh || [];
  return hotelImgs.find((i) => i.la_anh_chinh) || hotelImgs[0];
};

const HotelSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('price_asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedStars, setSelectedStars] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const filters = useMemo(() => ({
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
    ngay_nhan: searchParams.get('ngay_nhan') || '',
    ngay_tra: searchParams.get('ngay_tra') || '',
    so_khach: searchParams.get('so_khach') || '2',
  }), [searchParams]);

  useEffect(() => {
    publicHotelService.getLocations()
      .then((res) => setLocations(res.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setSelectedStars([]);
      setSelectedAmenities([]);
      setPriceMin('');
      setPriceMax('');
      try {
        const res = await publicHotelService.searchRooms(filters);
        setRooms(res.data?.data || []);
      } catch (err) {
        setRooms([]);
        setError(err.response?.data?.message || 'Không thể tải kết quả tìm kiếm');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const allAmenities = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      r.tien_nghi?.forEach((t) => set.add(t));
      r.khach_san?.tien_nghi?.forEach((t) => set.add(t));
    });
    return [...set].sort();
  }, [rooms]);

  const priceRange = useMemo(() => {
    if (!rooms.length) return { min: 0, max: 0 };
    const prices = rooms.map((r) => r.gia_hien_thi);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let list = [...rooms];

    if (priceMin !== '') {
      const min = Math.max(0, Number(priceMin));
      list = list.filter((r) => r.gia_hien_thi >= min);
    }
    if (priceMax !== '') {
      const max = Math.max(0, Number(priceMax));
      list = list.filter((r) => r.gia_hien_thi <= max);
    }
    if (selectedStars.length) {
      list = list.filter((r) => selectedStars.includes(r.khach_san?.so_sao || 0));
    }
    if (selectedAmenities.length) {
      list = list.filter((r) => {
        const all = [...(r.tien_nghi || []), ...(r.khach_san?.tien_nghi || [])];
        return selectedAmenities.every((a) => all.includes(a));
      });
    }

    if (sortBy === 'price_asc') list.sort((a, b) => a.gia_hien_thi - b.gia_hien_thi);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.gia_hien_thi - a.gia_hien_thi);
    else if (sortBy === 'stars_desc') {
      list.sort((a, b) => (b.khach_san?.so_sao || 0) - (a.khach_san?.so_sao || 0));
    }

    return list;
  }, [rooms, priceMin, priceMax, selectedStars, selectedAmenities, sortBy]);

  const locationName = locations.find(
    (l) => String(l.ma_dia_diem) === String(filters.ma_dia_diem)
  )?.ten_dia_diem || 'Tất cả địa điểm';

  const nights = useMemo(() => {
    if (!filters.ngay_nhan || !filters.ngay_tra) return 0;
    const a = new Date(filters.ngay_nhan);
    const b = new Date(filters.ngay_tra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [filters.ngay_nhan, filters.ngay_tra]);

  const toggleStar = (star) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSortBy('price_asc');
    setPriceMin('');
    setPriceMax('');
    setSelectedStars([]);
    setSelectedAmenities([]);
  };

  const hasActiveFilters = priceMin !== '' || priceMax !== '' || selectedStars.length > 0 || selectedAmenities.length > 0;

  return (
    <div className="search-page">
      <div className="search-summary">
        <h1 className="search-summary-title">
          {filteredRooms.length} loại phòng{locationName !== 'Tất cả địa điểm' ? ` tại ${locationName}` : ''}
          {hasActiveFilters && rooms.length !== filteredRooms.length && (
            <span style={{ fontSize: 14, fontWeight: 400, color: '#5a7a72' }}>
              {' '}(lọc từ {rooms.length})
            </span>
          )}
        </h1>
        <p className="search-summary-meta">
          {filters.ngay_nhan && filters.ngay_tra
            ? `${fmtDate(filters.ngay_nhan)} → ${fmtDate(filters.ngay_tra)} · ${nights} đêm · ${filters.so_khach} khách`
            : `${filters.so_khach} khách`}
          {' · '}
          <Link to={ROUTES.HOME} style={{ color: '#3C7363', fontWeight: 500 }}>← Tìm kiếm lại</Link>
        </p>
      </div>

      <div className="search-layout">
        <aside className="search-filter-sidebar">
          <div className="search-filter-card">
            <div className="search-filter-header">
              <h3 className="search-filter-title">🔍 Bộ lọc</h3>
              {hasActiveFilters && (
                <button type="button" className="search-filter-reset" onClick={resetFilters}>
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="search-filter-section">
              <label className="search-filter-label">Sắp xếp</label>
              <select
                className="search-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="search-filter-section">
              <label className="search-filter-label">Khoảng giá / đêm</label>
              {rooms.length > 0 && (
                <p className="search-filter-hint">
                  {fmt(priceRange.min)} – {fmt(priceRange.max)} ₫
                </p>
              )}
              <div className="search-filter-price-row">
                <input
                  type="number"
                  min={0}
                  className="search-filter-input"
                  placeholder="Tối thiểu"
                  value={priceMin}
                  onChange={(e) => setPriceMin(clampMinZero(e.target.value))}
                />
                <span>—</span>
                <input
                  type="number"
                  min={0}
                  className="search-filter-input"
                  placeholder="Tối đa"
                  value={priceMax}
                  onChange={(e) => setPriceMax(clampMinZero(e.target.value))}
                />
              </div>
            </div>

            <div className="search-filter-section">
              <label className="search-filter-label">Hạng sao khách sạn</label>
              <div className="search-filter-checks">
                {STAR_OPTIONS.map((star) => (
                  <label key={star} className="search-filter-check">
                    <input
                      type="checkbox"
                      checked={selectedStars.includes(star)}
                      onChange={() => toggleStar(star)}
                    />
                    {'⭐'.repeat(star)}
                  </label>
                ))}
              </div>
            </div>

            {allAmenities.length > 0 && (
              <div className="search-filter-section">
                <label className="search-filter-label">Tiện nghi</label>
                <div className="search-filter-checks">
                  {allAmenities.map((amenity) => (
                    <label key={amenity} className="search-filter-check">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="search-results-col">
          {loading && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
              ⏳ Đang tìm loại phòng phù hợp...
            </div>
          )}

          {!loading && error && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#e05c5c' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && rooms.length === 0 && (
            <div className="empty-state content-card">
              <div className="empty-state-icon">🛏️</div>
              <p className="empty-state-text">Không tìm thấy loại phòng phù hợp. Hãy thử đổi địa điểm hoặc ngày ở.</p>
              <Link to={ROUTES.HOME} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                Quay về trang chủ
              </Link>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="empty-state content-card">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}

          {!loading && !error && filteredRooms.length > 0 && (
            <div className="hotel-result-grid">
              {filteredRooms.map((room) => {
                const hotel = room.khach_san;
                const img = getRoomImage(room);
                return (
                  <article key={room.ma_loai_phong} className="hotel-result-card">
                    {img ? (
                      <img src={resolveUploadUrl(img.url)} alt={room.ten_loai} className="hotel-result-img" />
                    ) : (
                      <div className="hotel-result-img-placeholder">🛏️</div>
                    )}

                    <div className="hotel-result-body">
                      <h2 className="hotel-result-name">{room.ten_loai}</h2>
                      <p className="room-result-hotel">🏨 {hotel?.ten}</p>
                      <p className="hotel-result-location">
                        📍 {hotel?.dia_diem?.ten_dia_diem} · {hotel?.dia_chi}
                      </p>
                      {hotel?.so_sao > 0 && (
                        <div className="hotel-result-stars">{'⭐'.repeat(hotel.so_sao)}</div>
                      )}
                      <div className="hotel-result-room-meta">
                        <span>👥 Tối đa {room.suc_chua} khách</span>
                        {room.dien_tich && <span>📐 {room.dien_tich} m²</span>}
                        {room.phong_con_lai != null && (
                          <span className="badge badge-success">Còn {room.phong_con_lai} phòng</span>
                        )}
                      </div>
                      {(room.tien_nghi?.length > 0 || hotel?.tien_nghi?.length > 0) && (
                        <div className="hotel-result-amenities">
                          {[...(room.tien_nghi || []), ...(hotel?.tien_nghi || [])]
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .slice(0, 4)
                            .map((t) => (
                              <span key={t} className="hotel-result-amenity">{t}</span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="hotel-result-price">
                      <span className="hotel-result-price-label">Giá</span>
                      <span className="hotel-result-price-value">{fmt(room.gia_hien_thi)} ₫</span>
                      <span className="hotel-result-price-unit">
                        / đêm{nights > 1 && room.tong_gia ? ` · Tổng ${nights} đêm: ${fmt(room.tong_gia)} ₫` : ''}
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(buildRoomDetailUrl(hotel.ma_khach_san, room.ma_loai_phong, filters))}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPage;
