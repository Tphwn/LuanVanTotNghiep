import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import PriceRangeSlider from '../../components/customer/search/PriceRangeSlider';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const stars = (n) => '★'.repeat(Math.max(0, Number(n) || 0));

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

const buildHotelDetailUrl = (hotelId, maDiaDiem) => {
  const params = new URLSearchParams();
  if (maDiaDiem) params.set('ma_dia_diem', maDiaDiem);
  const qs = params.toString();
  return `/hotels/${hotelId}${qs ? `?${qs}` : ''}`;
};

const getRoomImage = (room) => {
  const roomImg = room.hinh_anh?.find((i) => i.la_anh_chinh) || room.hinh_anh?.[0];
  if (roomImg) return roomImg;
  const hotelImgs = room.khach_san?.hinh_anh || [];
  return hotelImgs.find((i) => i.la_anh_chinh) || hotelImgs[0];
};

const getHotelImage = (hotel) => {
  const imgs = hotel.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh) || imgs[0];
};

const FilterSidebar = ({
  sortBy,
  onSortChange,
  priceRange,
  priceMin,
  priceMax,
  onPriceChange,
  onPriceReset,
  selectedStars,
  onToggleStar,
  allAmenities,
  selectedAmenities,
  onToggleAmenity,
  onReset,
  hasActiveFilters,
  showSlider,
}) => (
  <aside className="search-filter-sidebar">
    <div className="search-filter-card">
      <div className="search-filter-header">
        <h3 className="search-filter-title">Bộ lọc</h3>
        {hasActiveFilters && (
          <button type="button" className="search-filter-reset" onClick={onReset}>
            Xóa lọc
          </button>
        )}
      </div>

      <div className="search-filter-section">
        <label className="search-filter-label">Sắp xếp</label>
        <select className="search-filter-select" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="search-filter-section">
        <label className="search-filter-label">Khoảng giá / đêm</label>
        {priceRange.max > priceRange.min && (
          <p className="search-filter-hint">
            {fmt(priceRange.min)} – {fmt(priceRange.max)} ₫
          </p>
        )}
        {showSlider && priceRange.max > priceRange.min ? (
          <PriceRangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={priceMin}
            valueMax={priceMax}
            onChange={({ min, max }) => onPriceChange(String(min), String(max))}
          />
        ) : (
          <p className="search-filter-hint">Chưa có dữ liệu giá để lọc</p>
        )}
        {showSlider && hasActiveFilters && (
          <button type="button" className="search-filter-reset" style={{ marginTop: 8 }} onClick={onPriceReset}>
            Đặt lại khoảng giá
          </button>
        )}
      </div>

      <div className="search-filter-section">
        <label className="search-filter-label">Hạng sao khách sạn</label>
        <div className="search-filter-checks">
          {STAR_OPTIONS.map((star) => (
            <label key={star} className="search-filter-check">
              <input
                type="checkbox"
                checked={selectedStars.includes(star)}
                onChange={() => onToggleStar(star)}
              />
              <span className="search-filter-stars">{stars(star)}</span>
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
                  onChange={() => onToggleAmenity(amenity)}
                />
                {amenity}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  </aside>
);

const HotelSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
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
  const isSearchMode = location.pathname === ROUTES.CUSTOMER.ROOM_SEARCH;

  useEffect(() => {
    if (
      location.pathname === ROUTES.CUSTOMER.HOTELS
      && searchParams.get('ngay_nhan')
      && searchParams.get('ngay_tra')
    ) {
      navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${searchParams.toString()}`, { replace: true });
    }
  }, [location.pathname, searchParams, navigate]);

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
        if (isSearchMode) {
          const res = await publicHotelService.searchRooms(filters);
          setRooms(res.data?.data || []);
          setHotels([]);
        } else {
          const res = await publicHotelService.listHotels({
            ma_dia_diem: filters.ma_dia_diem || undefined,
          });
          setHotels(res.data?.data || []);
          setRooms([]);
        }
      } catch (err) {
        setHotels([]);
        setRooms([]);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, isSearchMode]);

  const allAmenities = useMemo(() => {
    const set = new Set();
    if (isSearchMode) {
      rooms.forEach((r) => {
        r.tien_nghi?.forEach((t) => set.add(t));
        r.khach_san?.tien_nghi?.forEach((t) => set.add(t));
      });
    } else {
      hotels.forEach((h) => {
        h.tien_nghi?.forEach((t) => set.add(t.ten || t));
      });
    }
    return [...set].sort();
  }, [hotels, rooms, isSearchMode]);

  const priceRange = useMemo(() => {
    const prices = isSearchMode
      ? rooms.map((r) => r.gia_hien_thi)
      : hotels.map((h) => h.gia_tu).filter(Boolean);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [hotels, rooms, isSearchMode]);

  useEffect(() => {
    if (priceRange.max > priceRange.min && priceMin === '' && priceMax === '') {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    }
  }, [priceRange, priceMin, priceMax]);

  const applyPriceFilter = (list, getPrice) => {
    let result = [...list];
    if (priceMin !== '') {
      const min = Number(priceMin);
      result = result.filter((item) => getPrice(item) >= min);
    }
    if (priceMax !== '') {
      const max = Number(priceMax);
      result = result.filter((item) => getPrice(item) <= max);
    }
    return result;
  };

  const filteredHotels = useMemo(() => {
    let list = applyPriceFilter(hotels, (h) => h.gia_tu || 0);

    if (selectedStars.length) {
      list = list.filter((h) => selectedStars.includes(h.so_sao || 0));
    }
    if (selectedAmenities.length) {
      list = list.filter((h) => {
        const names = (h.tien_nghi || []).map((t) => t.ten || t);
        return selectedAmenities.every((a) => names.includes(a));
      });
    }

    if (sortBy === 'price_asc') list.sort((a, b) => (a.gia_tu || 0) - (b.gia_tu || 0));
    else if (sortBy === 'price_desc') list.sort((a, b) => (b.gia_tu || 0) - (a.gia_tu || 0));
    else if (sortBy === 'stars_desc') list.sort((a, b) => (b.so_sao || 0) - (a.so_sao || 0));

    return list;
  }, [hotels, priceMin, priceMax, selectedStars, selectedAmenities, sortBy]);

  const filteredRooms = useMemo(() => {
    let list = applyPriceFilter(rooms, (r) => r.gia_hien_thi);

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

  const resultCount = isSearchMode ? filteredRooms.length : filteredHotels.length;
  const sourceCount = isSearchMode ? rooms.length : hotels.length;

  const handleLocationChange = (maDiaDiem) => {
    const params = new URLSearchParams(searchParams);
    if (maDiaDiem) params.set('ma_dia_diem', maDiaDiem);
    else params.delete('ma_dia_diem');
    setSearchParams(params);
  };

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
    setSelectedStars([]);
    setSelectedAmenities([]);
    if (priceRange.max > priceRange.min) {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    } else {
      setPriceMin('');
      setPriceMax('');
    }
  };

  const hasActiveFilters = selectedStars.length > 0
    || selectedAmenities.length > 0
    || sortBy !== 'price_asc'
    || (priceRange.max > priceRange.min && (
      Number(priceMin) !== priceRange.min || Number(priceMax) !== priceRange.max
    ));

  const sidebarProps = {
    sortBy,
    onSortChange: setSortBy,
    priceRange,
    priceMin,
    priceMax,
    onPriceChange: (min, max) => { setPriceMin(min); setPriceMax(max); },
    onPriceReset: () => {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    },
    selectedStars,
    onToggleStar: toggleStar,
    allAmenities,
    selectedAmenities,
    onToggleAmenity: toggleAmenity,
    onReset: resetFilters,
    hasActiveFilters,
    showSlider: priceRange.max > priceRange.min,
  };

  return (
    <div className="search-page">
      <div className="search-summary">
        <div className="search-summary-main">
          <h1 className="search-summary-title">
            {isSearchMode
              ? `${resultCount} loại phòng${locationName !== 'Tất cả địa điểm' ? ` tại ${locationName}` : ''}`
              : `${resultCount} khách sạn${locationName !== 'Tất cả địa điểm' ? ` tại ${locationName}` : ''}`}
            {hasActiveFilters && sourceCount !== resultCount && (
              <span style={{ fontSize: 14, fontWeight: 400, color: '#5a7a72' }}>
                {' '}(lọc từ {sourceCount})
              </span>
            )}
          </h1>
          <p className="search-summary-meta">
            {isSearchMode ? (
              <>
                {fmtDate(filters.ngay_nhan)} → {fmtDate(filters.ngay_tra)} · {nights} đêm · {filters.so_khach} khách
                {' · '}
              </>
            ) : (
              <>Khách sạn có trên HOTEL BOOKiNG</>
            )}
          </p>
        </div>

        {!isSearchMode && (
          <div className="search-toolbar search-toolbar-inline">
            <label className="search-toolbar-label" htmlFor="browse-location">Địa điểm</label>
            <select
              id="browse-location"
              className="search-toolbar-select"
              value={filters.ma_dia_diem}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              <option value="">Tất cả địa điểm</option>
              {locations.map((loc) => (
                <option key={loc.ma_dia_diem} value={loc.ma_dia_diem}>
                  {loc.ten_dia_diem}{loc.tinh_thanh ? `, ${loc.tinh_thanh}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      

      <div className="search-layout">
        <FilterSidebar {...sidebarProps} />

        <div className="search-results-col">
          {loading && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
              {isSearchMode ? 'Đang tìm loại phòng phù hợp...' : 'Đang tải danh sách khách sạn...'}
            </div>
          )}

          {!loading && error && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#e05c5c' }}>
              {error}
            </div>
          )}

          {!loading && !error && sourceCount === 0 && (
            <div className="empty-state content-card">
              <p className="empty-state-text">
                {isSearchMode
                  ? 'Không tìm thấy loại phòng phù hợp. Hãy thử đổi địa điểm hoặc ngày ở.'
                  : 'Chưa có khách sạn nào đang hoạt động tại địa điểm này.'}
              </p>
              <Link to={ROUTES.HOME} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                {isSearchMode ? 'Quay về trang chủ' : 'Tìm phòng theo ngày'}
              </Link>
            </div>
          )}

          {!loading && !error && sourceCount > 0 && resultCount === 0 && (
            <div className="empty-state content-card">
              <p className="empty-state-text">Không có kết quả phù hợp bộ lọc</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Chế độ BROWSE: thẻ khách sạn */}
          {!loading && !error && !isSearchMode && filteredHotels.length > 0 && (
            <div className="hotel-result-grid">
              {filteredHotels.map((hotel) => {
                const img = getHotelImage(hotel);
                const amenityNames = (hotel.tien_nghi || []).map((t) => t.ten || t);
                return (
                  <article key={hotel.ma_khach_san} className="hotel-result-card hotel-browse-card">
                    {img ? (
                      <img src={resolveUploadUrl(img.url)} alt={hotel.ten} className="hotel-result-img" />
                    ) : (
                      <div className="hotel-result-img-placeholder" />
                    )}

                    <div className="hotel-result-body">
                      <h2 className="hotel-result-name">{hotel.ten}</h2>
                      <p className="hotel-result-location">
                        {hotel.dia_diem?.ten_dia_diem} · {hotel.dia_chi}
                      </p>
                      {hotel.so_sao > 0 && (
                        <div className="hotel-result-stars">{stars(hotel.so_sao)}</div>
                      )}
                      <p className="hotel-browse-meta">
                        {hotel.so_loai_phong} loại phòng
                      </p>
                      {amenityNames.length > 0 && (
                        <div className="hotel-result-amenities">
                          {amenityNames.slice(0, 4).map((t) => (
                            <span key={t} className="hotel-result-amenity">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hotel-result-price">
                      <span className="hotel-result-price-label">Giá từ</span>
                      <span className="hotel-result-price-value">{fmt(hotel.gia_tu)} ₫</span>
                      <span className="hotel-result-price-unit">/ đêm</span>
                      <Link
                        to={buildHotelDetailUrl(hotel.ma_khach_san, filters.ma_dia_diem)}
                        className="btn btn-primary btn-sm"
                      >
                        Xem khách sạn
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !error && isSearchMode && filteredRooms.length > 0 && (
            <div className="hotel-result-grid">
              {filteredRooms.map((room) => {
                const hotel = room.khach_san;
                const img = getRoomImage(room);
                return (
                  <article key={room.ma_loai_phong} className="hotel-result-card room-result-card">
                    {img ? (
                      <img src={resolveUploadUrl(img.url)} alt={room.ten_loai} className="hotel-result-img" />
                    ) : (
                      <div className="hotel-result-img-placeholder" />
                    )}

                    <div className="hotel-result-body">
                      <h2 className="hotel-result-name">{room.ten_loai}</h2>
                      <p className="room-result-hotel">{hotel?.ten}</p>
                      <p className="hotel-result-location">
                        {hotel?.dia_diem?.ten_dia_diem} · {hotel?.dia_chi}
                      </p>
                      {hotel?.so_sao > 0 && (
                        <div className="hotel-result-stars">{stars(hotel.so_sao)}</div>
                      )}
                      <div className="hotel-result-room-meta">
                        <span>Tối đa {room.suc_chua} khách</span>
                        {room.dien_tich && <span>{room.dien_tich} m²</span>}
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
                      <Link
                        to={buildRoomDetailUrl(hotel.ma_khach_san, room.ma_loai_phong, filters)}
                        className="btn btn-primary btn-sm"
                      >
                        Xem chi tiết
                      </Link>
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
